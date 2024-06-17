<template>
  <span>
    <a-button @click="modalProductOpen" :loading="this.loading">
      打包新版本
    </a-button>

    <a-modal
      title="编译进度"
      :mask="true"
      :visible="this.modalBuildVisible"
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

    <a-modal
      title="勾选需要打包的产品"
      :mask="true"
      :visible="this.modalProductVisible"
      :centered="true"
      :maskClosable="true"
      cancelText="关闭"
      okText="编译"
      width="80vw"
      :confirmLoading="this.modalConfirmLoading"
      @ok="this.modalProductOK"
      @cancel="this.modalProductHide"
      :afterClose="this.modalProductAfterClose"
    >
      <a-table
        :row-selection="{
          selectedRowKeys: selectedRowKeys,
          onChange: onSelectProductChange,
        }"
        :scroll="{ y: 500 }"
        :columns="columns"
        :data-source="data"
        rowKey="id"
        :pagination="false"
      >
        <span slot="product_name" slot-scope="text">
          {{ text.name }} - {{ text.name_cn }}
        </span>
      </a-table>
    </a-modal>
  </span>
</template>
<script>
const { ipcRenderer } = require("electron");
export default {
  data() {
    return {
      data: [],
      columns: [
        {
          title: "id",
          key: "id",
          dataIndex: "id",
          width: 200,
        },
        {
          title: "产品",
          key: "name",
          scopedSlots: { customRender: "product_name" },
        },
      ],
      loading: false,
      modalProductVisible: false,
      modalBuildVisible: false,
      modalConfirmLoading: false,
      selectedRowKeys: [],
      timer: null,
      percentage: 0,
    };
  },
  methods: {
    onSelectProductChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    onBuilding() {
      this.modalBuildVisible = true;
    },
    openTimer(version) {
      this.onBuilding();
      this.timer = setInterval(() => {
        this.$http({
          method: "GET",
          uri:
            this.$apiURL + "build_product_client_progress?version=" + version,
          resolveWithFullResponse: true,
          headers: {
            token: this.$getUserToken(),
          },
          json: true,
        }).then((response) => {
          console.log(response, "response");
          if (response.body.code == 0) {
            let percentage =
              response.body.data.build_success_count /
              response.body.data.product_count;
            this.percentage = parseInt(percentage * 100);
            ipcRenderer.send("set percentage", percentage);
            if (response.body.data.status == 4) {
              this.modalProductHide();
              ipcRenderer.send("set percentage", -1);
              this.$message.success("编译成功");
            }
          }
        });
      }, 1000);
    },
    modalProductOK() {
      let productID = this.selectedRowKeys.toString();
      this.$http({
        method: "POST",
        uri: this.$apiURL + "build_product_client",
        resolveWithFullResponse: true,
        formData: {
          id: productID,
        },
        headers: {
          token: this.$getUserToken(),
        },
        json: true,
      })
        .then((response) => {
          if (response.body.code == 0) {
            this.openTimer(response.body.data.version);
          } else {
            this.modalProductHide();
            this.$message.error(response.body.msg);
          }
        })
        .catch((response) => {
          this.modalProductHide();
          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
        });
    },
    modalProductOpen() {
      this.loading = true;
      this.modalProductShow();
      this.getProductList();
    },
    modalProductAfterClose() {
      this.selectedRowKeys = [];
      this.percentage = 0;
      this.modalBuildVisible = false;
      if (this.timer != null) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.loading = this.modalConfirmLoading = false;
    },
    modalProductShow() {
      this.modalProductVisible = true;
    },
    modalProductHide() {
      this.modalProductVisible = false;
    },
    getProductList() {
      this.$http({
        method: "GET",
        uri: this.$apiURL + "product",
        resolveWithFullResponse: true,
        headers: {
          token: this.$getUserToken(),
        },
        json: true,
      })
        .then((response) => {
          if (response.body.code == 0) {
            this.data = response.body.data;
          }
        })
        .catch((response) => {
          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
        });
    },
  },
};
</script>