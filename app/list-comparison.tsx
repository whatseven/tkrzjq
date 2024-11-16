"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function ListComparison() {
  const [list1, setList1] = useState<string>("");
  const [list2, setList2] = useState<string>("");
  const [results, setResults] = useState<{ onlyInList1: string[]; onlyInList2: string[]; inBoth: string[] } | null>(null);

  const handleCompare = () => {
    const arr1 = list1.split("\n").map(name => name.trim()).filter(name => name);
    const arr2 = list2.split("\n").map(name => name.trim()).filter(name => name);

    const onlyInList1 = arr1.filter(name => !arr2.includes(name));
    const onlyInList2 = arr2.filter(name => !arr1.includes(name));
    const inBoth = arr1.filter(name => arr2.includes(name));

    setResults({ onlyInList1, onlyInList2, inBoth });
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(results!.onlyInList1.map(name => ({ Name: name })));
    const ws2 = XLSX.utils.json_to_sheet(results!.onlyInList2.map(name => ({ Name: name })), { header: ["Name"] });
    const ws3 = XLSX.utils.json_to_sheet(results!.inBoth.map(name => ({ Name: name })), { header: ["Name"] });

    XLSX.utils.book_append_sheet(wb, ws1, "Only in List 1");
    XLSX.utils.book_append_sheet(wb, ws2, "Only in List 2");
    XLSX.utils.book_append_sheet(wb, ws3, "In Both");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "名单对比结果.xlsx");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">名单对比</h1>
      <textarea
        placeholder="请输入名单1（每个名字一行）"
        value={list1}
        onChange={(e) => setList1(e.target.value)}
        className="border p-2 w-full h-40 mb-4"
      />
      <textarea
        placeholder="请输入名单2（每个名字一行）"
        value={list2}
        onChange={(e) => setList2(e.target.value)}
        className="border p-2 w-full h-40 mb-4"
      />
      <button onClick={handleCompare} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        开始对比
      </button>
      {results && (
        <div>
          <h2 className="text-xl mb-2">对比结果</h2>
          <div>
            <h3>名单1中有但名单2中没有:</h3>
            <ul>
              {results.onlyInList1.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
            <h3>名单2中有但名单1中没有:</h3>
            <ul>
              {results.onlyInList2.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
            <h3>两个名单重复的名字:</h3>
            <ul>
              {results.inBoth.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
          <button onClick={handleExport} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
            导出为 Excel
          </button>
        </div>
      )}
    </div>
  );
} 