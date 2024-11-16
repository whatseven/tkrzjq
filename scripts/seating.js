// 处理名字列表
function processNameList(input) {
    return input
        .split(/[\n,]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0 && !name.match(/^\d+$/));
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const nameList = document.getElementById('nameList');
    const rowsInput = document.getElementById('rows');
    const columnsInput = document.getElementById('columns');
    const arrangeButton = document.getElementById('arrangeButton');
    const clearButton = document.getElementById('clearButton');
    const exportButton = document.getElementById('exportButton');
    const resultsDiv = document.getElementById('results');
    const seatingTable = document.getElementById('seatingTable');
    
    let seatingArrangement = [];

    // 文件上传处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const namesFromExcel = json
                .flat()
                .map(cell => cell?.toString().trim())
                .filter(name => name && name.length > 0 && !name.match(/^\d+$/));
            
            nameList.value = namesFromExcel.join('\n');
        };

        reader.readAsArrayBuffer(file);
    });

    // 排座处理
    arrangeButton.addEventListener('click', function() {
        const names = processNameList(nameList.value);
        const rows = parseInt(rowsInput.value);
        const columns = parseInt(columnsInput.value);
        const totalNames = names.length;

        // 调整分组比例
        const middleGroupSize = Math.ceil(totalNames * 0.4);
        const sideGroupSize = Math.ceil((totalNames - middleGroupSize) / 2);

        const group1 = names.slice(0, middleGroupSize);
        const group2 = names.slice(middleGroupSize, middleGroupSize + sideGroupSize);
        const group3 = names.slice(middleGroupSize + sideGroupSize);

        // 创建座位图
        seatingArrangement = Array.from({ length: rows }, () => Array(columns).fill(""));

        // 计算区域范围
        const leftStart = 0;
        const leftEnd = Math.floor((columns - 2) / 3);
        const middleStart = leftEnd + 1;
        const middleEnd = middleStart + Math.floor((columns - 2) / 3);
        const rightStart = middleEnd + 1;
        const rightEnd = columns;

        // 排座位 - 中间区域
        let currentIndex = 0;
        for (let row = 0; row < rows && currentIndex < group1.length; row++) {
            for (let col = middleStart; col < middleEnd && currentIndex < group1.length; col++) {
                seatingArrangement[row][col] = group1[currentIndex];
                currentIndex++;
            }
        }

        // 排座位 - 左区域
        currentIndex = 0;
        for (let row = 0; row < rows && currentIndex < group2.length; row++) {
            for (let col = leftStart; col < leftEnd && currentIndex < group2.length; col++) {
                seatingArrangement[row][col] = group2[currentIndex];
                currentIndex++;
            }
        }

        // 排座位 - 右区域
        currentIndex = 0;
        for (let row = 0; row < rows && currentIndex < group3.length; row++) {
            for (let col = rightStart; col < rightEnd && currentIndex < group3.length; col++) {
                seatingArrangement[row][col] = group3[currentIndex];
                currentIndex++;
            }
        }

        // 显示结果
        let tableHTML = '<tbody>';
        seatingArrangement.forEach((row, rowIndex) => {
            tableHTML += '<tr>';
            tableHTML += `<td class="border p-2 text-center min-w-[4rem] bg-gray-50">${rowIndex + 1}排</td>`;
            row.forEach(name => {
                tableHTML += `<td class="border p-2 text-center min-w-[3rem]">${name}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';
        
        seatingTable.innerHTML = tableHTML;
        resultsDiv.classList.remove('hidden');
    });

    // 清空处理
    clearButton.addEventListener('click', function() {
        nameList.value = '';
        rowsInput.value = '12';
        columnsInput.value = '26';
        seatingArrangement = [];
        resultsDiv.classList.add('hidden');
    });

    // 导出处理
    exportButton.addEventListener('click', function() {
        if (!seatingArrangement.length) return;

        const wb = XLSX.utils.book_new();
        
        const exportData = [
            ["", ...Array(parseInt(columnsInput.value)).fill("")],
            ["", ...Array(parseInt(columnsInput.value)).fill("")],
            ["", ...Array(Math.floor((parseInt(columnsInput.value)-3)/2)).fill(""), "主", "席", "台", ...Array(Math.ceil((parseInt(columnsInput.value)-3)/2)).fill("")],
            ["", ...Array(parseInt(columnsInput.value)).fill("")]
        ];

        seatingArrangement.forEach((row, index) => {
            exportData.push([`${index + 1}排`, ...row]);
        });

        const ws = XLSX.utils.aoa_to_sheet(exportData);

        // 设置样式
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
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

        const colWidth = [{ wch: 10 }, ...Array(parseInt(columnsInput.value)).fill({ wch: 8 })];
        ws['!cols'] = colWidth;

        XLSX.utils.book_append_sheet(wb, ws, "座位表");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, '座位表.xlsx');
    });
}); 