<!--
Excel 导入导出通用组件

功能：
  - 导入 .xls/.xlsx 文件，解析为 JSON 数据
  - 导出当前表格数据为 .xlsx 文件

使用方式：
  <CommonExcel
    :table-data="list"
    :loading="loading"
    filename="用户列表"
    @import-success="onImportSuccess"
    @update:loading="loading = $event"
  />

Props：
  tableData  - Array   - 表格数据源（导出用）
  loading    - Boolean - 加载状态（配合 .sync 或 v-model）
  filename   - String  - 导出文件名前缀，默认 "xlsxxlsx"

Events：
  import-success(data) - 导入成功，data 为解析后的数据数组
  update:loading(val)  - 更新 loading 状态

依赖：
  - XLSX      - Excel 文件解析
  - dayjs     - 日期格式化
  - ../api    - importExcel 接口
  - @/vendor/Export2Excel - 导出工具（动态导入）
-->
<template>
  <div class="excel-box">
    <el-upload
      action="#"
      accept=".xls,.xlsx"
      :auto-upload="true"
      :multiple="false"
      :show-file-list="false"
      :http-request="httpRequest"
    >
      <el-button type="file" size="medium">导入excel</el-button>
    </el-upload>
    <el-button type="file" size="medium" @click="exportExcelFn"
      >导出excel</el-button
    >
  </div>
</template>

<script>

import * as XLSX from "xlsx";
import dayjs from "dayjs";

export default {
  data() {
    return {
      excelData: {},
    };
  },
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
  },
  methods: {
    /** 从父组件 el-table 的 refTable 引用中提取表头配置 */
    getTableHeader() {
      const tableHeader = [];
      if (
        !this.$parent.$refs.refTable ||
        !this.$parent.$refs.refTable.$children
      )
        return;

      this.$parent.$refs.refTable.$children.forEach((e) => {
        if (e.$children.length !== 0) {
          e.$children.forEach((v) => {
            if (v.label !== undefined && v.prop !== undefined) {
              tableHeader.push({ key: v.prop, name: v.label });
            }
          });
        }
        if (e.label !== undefined && e.prop !== undefined) {
          tableHeader.push({ key: e.prop, name: e.label });
        }
      });
      return tableHeader;
    },

    /** 导出当前表格数据为 Excel 文件 */
    exportExcelFn() {
      let tHeader, data;

      if (this.columns) {
        tHeader = this.columns.map(c => c.label)
        data = this.tableData.map(row => {
          return this.columns.map(c => {
            if (c.formatter) return c.formatter(row)
            if (c.prop) return row[c.prop]
            return ''
          })
        })
      } else {
        const xlsHeader = this.getTableHeader()
        tHeader = xlsHeader.map(obj => obj.name)
        data = this.tableData.map(obj => {
          return xlsHeader.map(v => obj[v.key])
        })
      }

      import("@/vendor/Export2Excel").then((excel) => {
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: this.filename + "_" + this.getDateStr(),
          autoWidth: true,
          bookType: "xlsx",
        });
      });
    },

    /** 校验 -> 解析 -> 调用接口 -> 通知父组件 */
    async httpRequest({ file }) {
      const isValid = this.validateFile(file)
      if (!isValid) return

      this.$emit("update:loading", true);
      await this.readerData(file);
      const res = await this.$api.importExcel(this.excelData);
      this.$emit("import-success", this.transExcel(this.excelData.results));
      this.$emit("update:loading", false);
      if (res.fail > 0) {
        const msg = `导入完成：成功 ${res.success} 条，失败 ${res.fail} 条` + (res.errors ? `\n${res.errors.map(e => `第${e.row}行：${e.message}`).join('\n')}` : '')
        this.$alert(msg, '导入结果', { confirmButtonText: '知道了', dangerouslyUseHTMLString: false })
      } else {
        this.$message.success(`导入成功 ${res.success} 条`)
      }
    },

    validateFile(file) {
      const isXls = file.type === "application/vnd.ms-excel";
      const isXlsx =
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      if (!isXls && !isXlsx) {
        this.$message.error("上传文件只能是 xls/xlsx 格式！");
        return false;
      }
      if (file.size / 1024 / 1024 >= 10) {
        this.$message.error("上传文件大小不超过 10M！");
        return false;
      }
      return true;
    },

    /** 将导入的 Excel 行数据按表头映射为组件可用的对象数组 */
    transExcel(results) {
      const mapHeader = {};
      this.getTableHeader().forEach((e) => (mapHeader[e.name] = e.key));
      return results.map((item) => {
        const obj = {};
        Object.keys(item).forEach((k) => {
          const key = mapHeader[k];
          if (key) obj[key] = this.parseExcelValue(item[k]);
        });
        return obj;
      });
    },

    /** 解析单元格值：数字日期序列号自动转为日期字符串 */
    parseExcelValue(value) {
      if (typeof value === "number" && value > 1 && value < 300000) {
        return this.formatExcelDate(value);
      }
      return value;
    },

    /** 保存解析后的 Excel 原始数据 */
    generateData({ header, results }) {
      this.excelData.header = header;
      this.excelData.results = results;
    },

    /** 用 FileReader 读取 Excel 文件并解析 */
    readerData(rawFile) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const header = this.getHeaderRow(worksheet);
          const results = XLSX.utils.sheet_to_json(worksheet);
          this.generateData({ header, results });
          resolve();
        };
        reader.readAsArrayBuffer(rawFile);
      });
    },

    /** Excel 序列号数字转日期字符串（dayjs） */
    formatExcelDate(serial, format = "YYYY-MM-DD") {
      if (typeof serial === "number") {
        return dayjs(
          new Date((serial - 25567) * 86400 * 1000)
        ).format(format);
      }
      return dayjs(serial).format(format);
    },

    /** 获取当天日期字符串，用于导出文件名 */
    getDateStr() {
      return dayjs().format("YYYYMMDD");
    },

    /** 获取 Excel 首行列头 */
    getHeaderRow(sheet) {
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
