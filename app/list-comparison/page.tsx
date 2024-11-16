"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// 处理名字组合的辅助函数
const combineNames = (names: string[]): string[] => {
  const result: string[] = [];
  let i = 0;
  
  while (i < names.length) {
    const current = names[i];
    const next = names[i + 1];
    
    // 如果当前部分只有一个字，且后面还有内容，则需要组合
    if (current.length === 1 && next) {
      result.push(current + next);
      i += 2; // 跳过下一个部分
    } else {
      // 当前部分不是单字，或者是最后一个部分
      if (current.length > 1) {
        result.push(current);
      }
      i++;
    }
  }
  
  return result;
};

// 处理不同形式的名单输入
const processNameList = (input: string): string[] => {
  // 1. 首先处理逗号加空格的情况
  const normalizedInput = input
    .replace(/,\s+/g, '\n') // 将逗号+空格替换为换行
    .replace(/，\s*/g, '\n'); // 处理中文逗号

  // 2. 处理多个空格的情况
  const parts = normalizedInput
    .split(/[\n]+/) // 先按换行分割
    .map(line => line.trim()) // 处理每一行
    .filter(line => line.length > 0) // 过滤空行
    .map(line => 
      line
        .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
        .split(' ') // 按空格分割
    )
    .flat(); // 展平数组

  // 3. 组合单字名字
  return combineNames(parts);
};

export default function ListComparison() {
  const [list1, setList1] = useState<string>("");
  const [list2, setList2] = useState<string>("");
  const [results, setResults] = useState<{ onlyInList1: string[]; onlyInList2: string[]; inBoth: string[] } | null>(null);

  const handleCompare = () => {
    // 处理两个名单
    const arr1 = processNameList(list1);
    const arr2 = processNameList(list2);

    // 找出差异和重复
    const onlyInList1 = arr1.filter(name => !arr2.includes(name));
    const onlyInList2 = arr2.filter(name => !arr1.includes(name));
    const inBoth = arr1.filter(name => arr2.includes(name));

    setResults({ onlyInList1, onlyInList2, inBoth });
  };

  const handleExport = () => {
    if (!results) return;

    const wb = XLSX.utils.book_new();
    
    // 创建三个工作表
    const ws1 = XLSX.utils.json_to_sheet(results.onlyInList1.map(name => ({ "名单1独有": name })));
    const ws2 = XLSX.utils.json_to_sheet(results.onlyInList2.map(name => ({ "名单2独有": name })));
    const ws3 = XLSX.utils.json_to_sheet(results.inBoth.map(name => ({ "重复名字": name })));

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws1, "名单1独有");
    XLSX.utils.book_append_sheet(wb, ws2, "名单2独有");
    XLSX.utils.book_append_sheet(wb, ws3, "重复名字");

    // 导出为Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "名单对比结果.xlsx");
  };

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
      const namesFromExcel = json.flat().map((name: any) => name.toString().trim()).filter((name: string) => name.length > 0);
      
      // 将读取到的名字设置到输入框
      setList1(namesFromExcel.join("\n")); // 假设将其放入名单1
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-pink-600">名单对比</h1>
        
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          className="mb-4"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <textarea
              placeholder="请输入名单1（支持换行、逗号、空格分隔）"
              value={list1}
              onChange={(e) => setList1(e.target.value)}
              className="w-full h-48 p-4 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div>
            <textarea
              placeholder="请输入名单2（支持换行、逗号、空格分隔）"
              value={list2}
              onChange={(e) => setList2(e.target.value)}
              className="w-full h-48 p-4 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleCompare} 
            className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            开始对比
          </button>
        </div>

        {results && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-6 text-pink-600">对比结果</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-pink-700">名单1独有:</h3>
                <ul className="space-y-2">
                  {results.onlyInList1.map((name, index) => (
                    <li key={index} className="text-gray-700">{name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-pink-700">名单2独有:</h3>
                <ul className="space-y-2">
                  {results.onlyInList2.map((name, index) => (
                    <li key={index} className="text-gray-700">{name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-pink-700">重复名字:</h3>
                <ul className="space-y-2">
                  {results.inBoth.map((name, index) => (
                    <li key={index} className="text-gray-700">{name}</li>
                  ))}
                </ul>
              </div>
            </div>
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