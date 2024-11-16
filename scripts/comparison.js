// 处理名字组合的辅助函数
function combineNames(names) {
    const result = [];
    let i = 0;
    
    while (i < names.length) {
        const current = names[i];
        const next = names[i + 1];
        
        if (current.length === 1 && next) {
            result.push(current + next);
            i += 2;
        } else {
            if (current.length > 1) {
                result.push(current);
            }
            i++;
        }
    }
    
    return result;
}

// 处理不同形式的名单输入
function processNameList(input) {
    const normalizedInput = input
        .replace(/,\s+/g, '\n')
        .replace(/，\s*/g, '\n');

    const parts = normalizedInput
        .split(/[\n]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => 
            line
                .replace(/\s+/g, ' ')
                .split(' ')
        )
        .flat();

    return combineNames(parts);
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const list1Input = document.getElementById('list1');
    const list2Input = document.getElementById('list2');
    const compareButton = document.getElementById('compareButton');
    const exportButton = document.getElementById('exportButton');
    const resultsDiv = document.getElementById('results');
    
    let comparisonResults = null;

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
                .map(name => name?.toString().trim())
                .filter(name => name && name.length > 0);
            
            list1Input.value = namesFromExcel.join('\n');
        };

        reader.readAsArrayBuffer(file);
    });

    // 对比处理
    compareButton.addEventListener('click', function() {
        const arr1 = processNameList(list1Input.value);
        const arr2 = processNameList(list2Input.value);

        const onlyInList1 = arr1.filter(name => !arr2.includes(name));
        const onlyInList2 = arr2.filter(name => !arr1.includes(name));
        const inBoth = arr1.filter(name => arr2.includes(name));

        comparisonResults = { onlyInList1, onlyInList2, inBoth };

        // 显示结果
        document.getElementById('onlyInList1').innerHTML = 
            onlyInList1.map(name => `<li class="text-gray-700">${name}</li>`).join('');
        document.getElementById('onlyInList2').innerHTML = 
            onlyInList2.map(name => `<li class="text-gray-700">${name}</li>`).join('');
        document.getElementById('inBoth').innerHTML = 
            inBoth.map(name => `<li class="text-gray-700">${name}</li>`).join('');

        resultsDiv.classList.remove('hidden');
    });

    // 导出处理
    exportButton.addEventListener('click', function() {
        if (!comparisonResults) return;

        const wb = XLSX.utils.book_new();
        
        const ws1 = XLSX.utils.json_to_sheet(
            comparisonResults.onlyInList1.map(name => ({ "名单1独有": name }))
        );
        const ws2 = XLSX.utils.json_to_sheet(
            comparisonResults.onlyInList2.map(name => ({ "名单2独有": name }))
        );
        const ws3 = XLSX.utils.json_to_sheet(
            comparisonResults.inBoth.map(name => ({ "重复名字": name }))
        );

        XLSX.utils.book_append_sheet(wb, ws1, "名单1独有");
        XLSX.utils.book_append_sheet(wb, ws2, "名单2独有");
        XLSX.utils.book_append_sheet(wb, ws3, "重复名字");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, '名单对比结果.xlsx');
    });
}); 