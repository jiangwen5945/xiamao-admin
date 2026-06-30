<!--
Excel 导入导出通用组件

功能：
  - 导入 .xls/.xlsx 文件，解析为 JSON 数据
  - 导出当前表格数据为 .xlsx 文件

使用方式（仅导出）：
  <CommonExcel :table-data="list" filename="用户列表" :columns="exportColumns" />

使用方式（导出 + 导入）：
  <CommonExcel
    :table-data="list"
    :loading.sync="loading"
    filename="商品列表"
    :columns="exportColumns"
    :on-import="handleImport"
  />

Props：
  tableData  - Array    - 表格数据源（导出用）
  loading    - Boolean  - 加载状态（配合 .sync）
  filename   - String   - 导出文件名前缀，默认 "xlsxxlsx"
  columns    - Array    - 导出列配置 [{ label, prop?, formatter? }]
  onImport   - Function - 导入回调，接收 { header, results }

依赖：
  - XLSX      - Excel 文件解析
  - dayjs     - 日期格式化
  - @/vendor/Export2Excel - 导出工具（动态导入）
-->
<template>
  <div class="excel-box">
    <el-upload
      v-if="onImport"
      action="#"
      accept=".xls,.xlsx"
      :auto-upload="true"
      :multiple="false"
      :show-file-list="false"
      :http-request="httpRequest"
    >
      <el-button type="file" size="medium">{{ importText }}</el-button>
    </el-upload>
    <el-button type="file" size="medium" @click="exportExcelFn">{{ exportText }}</el-button>
  </div>
</template>

<script>

import * as XLSX from "xlsx";
import dayjs from "dayjs";

function getHeaderRow(sheet) {
  const headers = [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const R = range.s.r;
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
    let hdr = "UNKNOWN " + C;
    if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
    headers.push(hdr);
  }
  return headers;
}

function readFileAsArrayBuffer(rawFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(rawFile);
  });
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const header = getHeaderRow(worksheet);
  const results = XLSX.utils.sheet_to_json(worksheet);
  return { header, results };
}

export default {
  props: {
    tableData: Array,
    loading: Boolean,
    filename: {
      type: String,
      default: "xlsxxlsx",
    },
    columns: {
      type: Array,
      default: () => null,
    },
    onImport: {
      type: Function,
      default: null,
    },
    importText: {
      type: String,
      default: '导入excel',
    },
    exportText: {
      type: String,
      default: '导出excel',
    },
  },
  methods: {
    async exportExcelFn() {
      this.$emit("update:loading", true);
      try {
        const tHeader = this.columns.map(c => c.label)
        const data = this.tableData.map(row => {
          return this.columns.map(c => {
            if (c.formatter) return c.formatter(row)
            if (c.prop) return row[c.prop]
            return ''
          })
        })

        const excel = await import("@/vendor/Export2Excel")
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: this.filename + "_" + dayjs().format("YYYYMMDD"),
          autoWidth: true,
          bookType: "xlsx",
        });
      } finally {
        this.$emit("update:loading", false);
      }
    },

    async httpRequest({ file }) {
      if (!this.validateFile(file)) return

      this.$emit("update:loading", true);
      try {
        const buffer = await readFileAsArrayBuffer(file)
        const parsed = parseExcel(buffer)
        await this.onImport(parsed)
      } catch (e) {
        this.$message({ type: 'error', message: e.message || '导入失败' })
      } finally {
        this.$emit("update:loading", false);
      }
    },

    validateFile(file) {
      const extMatch = /\.(xls|xlsx)$/i.test(file.name)
      const typeMatch = file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      if (!extMatch && !typeMatch) {
        this.$message.error("上传文件只能是 xls/xlsx 格式！");
        return false;
      }
      if (file.size / 1024 / 1024 >= 10) {
        this.$message.error("上传文件大小不超过 10M！");
        return false;
      }
      return true;
    },
  },
};
</script>
<style lang="scss" scoped>
.excel-box {
  display: flex;
  margin-left: 10px;

  button {
    margin-right: 10px;
  }
}
</style>
