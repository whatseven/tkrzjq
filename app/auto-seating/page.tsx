"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// 处理名字组合的辅助函数
const processNameList = (input: string): string[] => {
  return input
    .split(/[\n,]+/)
    .map(name => name.trim())
    .filter(name => name.length > 0 && !name.match(/^\d+$/)); // 过滤掉纯数字（序号）
};

export default function AutoSeating() {
  const [names, setNames] = useState<string>("");
  const [rows, setRows] = useState<number>(12);  // 默认12排
  const [columns, setColumns] = useState<number>(26);  // 默认26列
  const [seatingArrangement, setSeatingArrangement] = useState<string[][]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // 将工作表转换为 JSON 格式
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // 提取所有单元格的内容，过滤掉空值和纯数字
      const namesFromExcel = json
        .flat()
        .map(cell => cell?.toString().trim())
        .filter(name => name && name.length > 0 && !name.match(/^\d+$/));
      
      setNames(namesFromExcel.join("\n"));
    };

    reader.readAsArrayBuffer(file);
  };

  const handleArrange = () => {
    const nameList = processNameList(names);
    const totalNames = nameList.length;

    // 调整分组比例，让中间区域稍多一些
    const middleGroupSize = Math.ceil(totalNames * 0.4); // 中间区域占 40%
    const sideGroupSize = Math.ceil((totalNames - middleGroupSize) / 2); // 两边区域平分剩余人数

    const group1 = nameList.slice(0, middleGroupSize); // 中间区域
    const group2 = nameList.slice(middleGroupSize, middleGroupSize + sideGroupSize); // 左区域
    const group3 = nameList.slice(middleGroupSize + sideGroupSize); // 右区域

    // 创建座位图
    const arrangement: string[][] = Array.from({ length: rows }, () => 
      Array(columns).fill("")
    );

    // 计算三个区域的列范围（每个区域之间空一列）
    const leftStart = 0;
    const leftEnd = Math.floor((columns - 2) / 3);
    const middleStart = leftEnd + 1;
    const middleEnd = middleStart + Math.floor((columns - 2) / 3);
    const rightStart = middleEnd + 1;
    const rightEnd = columns;

    // 排座位 - 中间区域（一排一排排）
    let currentIndex = 0;
    for (let row = 0; row < rows && currentIndex < group1.length; row++) {
      for (let col = middleStart; col < middleEnd && currentIndex < group1.length; col++) {
        arrangement[row][col] = group1[currentIndex];
        currentIndex++;
      }
    }

    // 排座位 - 左区域
    currentIndex = 0;
    for (let row = 0; row < rows && currentIndex < group2.length; row++) {
      for (let col = leftStart; col < leftEnd && currentIndex < group2.length; col++) {
        arrangement[row][col] = group2[currentIndex];
        currentIndex++;
      }
    }

    // 排座位 - 右区域
    currentIndex = 0;
    for (let row = 0; row < rows && currentIndex < group3.length; row++) {
      for (let col = rightStart; col < rightEnd && currentIndex < group3.length; col++) {
        arrangement[row][col] = group3[currentIndex];
        currentIndex++;
      }
    }

    setSeatingArrangement(arrangement);
  };

  const handleExport = () => {
    if (!seatingArrangement.length) return;

    const wb = XLSX.utils.book_new();
    
    // 添加主席台标记和序号列
    const exportData = [
      ["", ...Array(columns).fill("")], // 空行
      ["", ...Array(columns).fill("")], // 空行
      ["", ...Array(Math.floor((columns-3)/2)).fill(""), "主", "席", "台", ...Array(Math.ceil((columns-3)/2)).fill("")],
      ["", ...Array(columns).fill("")], // 空行
    ];

    // 添加座位数据（包含排数说明）
    seatingArrangement.forEach((row, index) => {
      exportData.push([
        `${index + 1}排`, // 添加排数说明
        ...row
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // 设置单元格样式
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell_address]) continue;
        ws[cell_address].s = {
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }

    // 设置列宽（第一列稍宽一些用于显示排数）
    const colWidth = [{ wch: 10 }, ...Array(columns).fill({ wch: 8 })];
    ws["!cols"] = colWidth;

    XLSX.utils.book_append_sheet(wb, ws, "座位表");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "座位表.xlsx");
  };

  const handleClear = () => {
    setNames("");
    setRows(12);
    setColumns(26);
    setSeatingArrangement([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-pink-600">自动排座</h1>
        
        <div className="mb-4">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload}
            className="mb-4 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-pink-50 file:text-pink-700
              hover:file:bg-pink-100"
          />
        </div>

        <textarea
          placeholder="请输入名单（支持换行或逗号分隔）"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          className="w-full h-48 p-4 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col">
            <label className="text-gray-700 mb-2">设置行数（排数）：</label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="border border-pink-200 rounded-lg p-2"
              min="1"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-700 mb-2">设置列数（每排座位数）：</label>
            <input
              type="number"
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              className="border border-pink-200 rounded-lg p-2"
              min="1"
            />
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button 
            onClick={handleArrange} 
            className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            排座
          </button>
          <button 
            onClick={handleClear} 
            className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-4"
          >
            清空
          </button>
        </div>

        {seatingArrangement.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <h2 className="text-2xl font-semibold mb-6 text-pink-600">排座结果</h2>
            <div className="text-center mb-4 text-gray-600">主席台</div>
            <table className="w-full border-collapse">
              <tbody>
                {seatingArrangement.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border p-2 text-center min-w-[4rem] bg-gray-50">
                      {rowIndex + 1}排
                    </td>
                    {row.map((name, colIndex) => (
                      <td key={colIndex} className="border p-2 text-center min-w-[3rem]">
                        {name}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-6">
              <button 
                onClick={handleExport} 
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                导出为Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 