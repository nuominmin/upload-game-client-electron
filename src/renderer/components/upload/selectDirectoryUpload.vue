<template>
  <span>
    <a-button @click="selectDirectory" :loading="this.loading">
      {{ uploadButtonText }}
    </a-button>
    <a-modal
      title="上传进度"
      :mask="true"
      :visible="this.modalVisible"
      :centered="true"
      :closable="false"
      :keyboard="false"
      :footer="null"
    >
      <a-progress
        :stroke-width="24"
        :percent="percentage"
        :status="percentage == 100 ? 'success' : null"
      ></a-progress>
    </a-modal>
  </span>
</template>
<script>
import * as util from "../../../main/util";
const { ipcRenderer } = require("electron");
const { dialog } = require("electron").remote;

export default {
  data() {
    return {
      fileList: [],
      percentage: 0,
      version: "",
      loading: false,
      uploadButtonText: "选取目录",
      modalVisible: false,
      timer: null,
    };
  },
  methods: {
    uploadBefore() {
      this.loading = true;
    },
    onUploading() {
      this.modalVisible = true;
      this.uploadButtonText = "文件上传中";
    },
    uploadAfter() {
      this.modalVisible = false;
      this.uploadButtonText = "选取目录";
      this.loading = false;
      this.percentage = 0;
      if (this.timer != null) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    selectDirectory() {
      this.uploadBefore();
      this.fileList = [];
      dialog.showOpenDialog(
        {
          properties: [
            "openDirectory",
            "openFile",
            "showHiddenFiles",
            "createDirectory",
          ],
        },
        (e) => {
          // let e = result.filePaths;

          if (e == undefined || e.length == 0) {
            this.uploadAfter();
            return;
          }

          // 设置版本
          this.version = e[0].substring(
            e[0].lastIndexOf("\\") + 1,
            e[0].length
          );

          let files = util.wrapperFiles(e[0]);
          let filesLength = files.length;
          this.percentage = 0;

          if (files && filesLength > 0) {
            let uuid = this.$uuid.v4();
            this.timer = setInterval(() => {
              this.$http({
                method: "POST",
                uri: this.$apiURL + "upload_count",
                resolveWithFullResponse: true,
                formData: {
                  uuid: uuid,
                  count: filesLength,
                  version: this.version,
                },
                headers: {
                  token: this.$getUserToken(),
                },
                json: true,
              }).then((response) => {
                if (response.body.code == 0) {
                  let percentage = response.body.data.succeed / filesLength;
                  this.percentage = parseInt(percentage * 100);
                  ipcRenderer.send("set percentage", percentage);

                  if (this.percentage >= 100) {
                    ipcRenderer.send("set percentage", -1);
                    this.uploadAfter();
                    this.$message.success("上传完成");
                  }
                }
              });
            }, 1000);

            this.onUploading();

            files.forEach((item, _) => {
              let file = util.readFile(item.path, item.filename);
              this.$http({
                method: "POST",
                uri: this.$apiURL + "upload",
                resolveWithFullResponse: true,
                formData: {
                  file: {
                    value: file,
                    options: {
                      filename: item.filename,
                    },
                  },
                  filename: item.filename,
                  uuid: uuid,
                },
                headers: {
                  "content-type": "multipart/form-data",
                  token: this.$getUserToken(),
                },
                json: true,
              }).catch((response) => {
                this.uploadAfter();
                this.$message.error(
                  response.error.msg ? response.error.msg : response.message
                );
              });
            });
          } else {
            this.uploadAfter();
            this.$message.info("未检测到文件");
          }
        }
      );
      console.log(11111111);
    },
  },
};
</script>