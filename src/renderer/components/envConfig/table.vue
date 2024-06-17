// 产品配置如果为空则红色标识
<template>
  <div>
    <a-table
      :scroll="{ y: 600 }"
      :columns="columns"
      :data-source="data"
      rowKey="id"
      :pagination="false"
      expandRowByClick
    >
      <span slot="operation" slot-scope="text" class="table-operation">
        <a-space size="middle">
          <a-button @click.stop="modalBucketHostOpen(text)">
            修改桶域名
          </a-button>
        </a-space>
      </span>

      <a-table
        slot="expandedRowRender"
        slot-scope="innerText"
        :columns="tableColumns"
        :data-source="innerText.product"
        :pagination="false"
        rowKey="id"
      >
        <span slot="product_name" slot-scope="text">
          {{ text.name }} - {{ text.name_cn }}
        </span>

        <span slot="operation" slot-scope="text" class="table-operation">
          <a-space size="middle">
            <a-button
              type="danger"
              @click="modalOpen(text, innerText.id)"
              v-if="text.content == ''"
            >
              填写产品配置
            </a-button>
            <a-button @click="modalOpen(text, innerText.id)" v-else>
              修改产品配置
            </a-button>
          </a-space>
        </span>
      </a-table>
    </a-table>

    <a-modal
      title="修改桶域名"
      :mask="true"
      :visible="this.modalBucketHostVisible"
      :centered="true"
      :maskClosable="true"
      cancelText="关闭"
      okText="保存"
      width="80vw"
      :confirmLoading="this.modalBucketHostConfirmLoading"
      @ok="this.modalBucketHostOK"
      @cancel="this.modalBucketHostHide"
      :afterClose="this.modalBucketHostAfterClose"
    >
      <a-textarea
        :autoFocus="true"
        allow-clear
        type="textarea"
        :auto-size="{ minRows: 25 }"
        :style="{ resize: 'none' }"
        v-model="modalBucketHostContent"
      />
    </a-modal>

    <a-modal
      :title="this.modalTitle + ' （%s是占位符，用于替换最新版本号） '"
      :mask="true"
      :visible="this.modalVisible"
      :centered="true"
      :maskClosable="true"
      cancelText="关闭"
      okText="保存"
      width="80vw"
      :confirmLoading="this.modalConfirmLoading"
      @ok="this.modalOK"
      @cancel="this.modalHide"
      :afterClose="this.modalAfterClose"
    >
      <a-textarea
        :autoFocus="true"
        allow-clear
        type="textarea"
        :auto-size="{ minRows: 25 }"
        :style="{ resize: 'none' }"
        v-model="modalProductContent"
      />
    </a-modal>
  </div>
</template>

<script>
export default {
  data() {
    return {
      data: [],
      modalConfirmLoading: false,
      modalVisible: false,
      modalTitle: "产品配置",
      modalProductID: 0,
      modalEnvID: 0,
      modalProductContent: "",

      modalBucketHostConfirmLoading: false,
      modalBucketHostVisible: false,
      modalBucketHostContent: "",

      columns: [
        {
          title: "环境",
          key: "name_cn",
          dataIndex: "name_cn",
        },
        {
          title: "桶域名",
          key: "bucket_host",
          dataIndex: "bucket_host",
        },
        {
          title: "操作",
          key: "operation",
          scopedSlots: { customRender: "operation" },
          width: 250,
        },
      ],
      tableColumns: [
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
        {
          title: "操作",
          key: "operation",
          scopedSlots: { customRender: "operation" },
          width: 250,
        },
      ],
    };
  },
  mounted() {
    this.getTableList();
    let timer = setInterval(() => {
      this.getTableList();
    }, 2000);
    this.$once("hook:beforeDestroy", () => {
      clearInterval(timer);
    });
  },
  methods: {
    modalOpen(productInfo, envID) {
      this.modalTitle = productInfo.name_cn + "配置";
      this.modalProductID = productInfo.id;
      this.modalEnvID = envID;
      this.modalProductContent = productInfo.content;
      this.modalShow();
    },
    modalOK() {
      if (this.modalEnvID == 0) {
        console.error(
          "envID:",
          this.modalEnvID,
          " productID:",
          this.modalProductID,
          " productContent:",
          this.modalProductContent
        );
        return;
      }
      this.modalConfirmLoading = true;

      this.$http({
        method: "POST",
        uri: this.$apiURL + "save_env_product_content",
        resolveWithFullResponse: true,
        formData: {
          env_id: this.modalEnvID,
          product_id: this.modalProductID,
          content: this.modalProductContent,
        },
        headers: {
          token: this.$getUserToken(),
        },
        json: true,
      })
        .then((response) => {
          if (response.body.code == 0) {
            this.$message.success(response.body.msg);
          } else {
            this.$message.error(response.body.msg);
          }
          this.modalHide();
        })
        .catch((response) => {
          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
          this.modalHide();
        });
    },
    modalAfterClose() {
      this.modalConfirmLoading = false;
      this.modalTitle = "产品配置";
      this.modalProductID = 0;
      this.modalEnvID = 0;
      this.modalProductContent = "";
    },
    modalShow() {
      this.modalVisible = true;
    },
    modalHide() {
      // 隐藏的时候重新拿数据
      this.getTableList();

      this.modalVisible = false;
    },
    modalBucketHostOpen(envInfo) {
      this.modalEnvID = envInfo.id;
      this.modalBucketHostContent = envInfo.bucket_host;
      this.modalBucketHostShow();
      return false;
    },
    modalBucketHostOK() {
      if (this.modalEnvID == 0) {
        console.error(
          "envID:",
          this.modalEnvID,
          " bucketHost:",
          this.modalBucketHostContent
        );
        return;
      }
      this.modalBucketHostConfirmLoading = true;

      this.$http({
        method: "POST",
        uri: this.$apiURL + "save_env_bucket_host_content",
        resolveWithFullResponse: true,
        formData: {
          env_id: this.modalEnvID,
          content: this.modalBucketHostContent,
        },
        headers: {
          token: this.$getUserToken(),
        },
        json: true,
      })
        .then((response) => {
          if (response.body.code == 0) {
            this.$message.success(response.body.msg);
          } else {
            this.$message.error(response.body.msg);
          }
          this.modalBucketHostHide();
        })
        .catch((response) => {
          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
          this.modalBucketHostHide();
        });
    },
    modalBucketHostAfterClose() {
      this.modalBucketHostConfirmLoading = false;
      this.modalEnvID = 0;
      this.modalBucketHostContent = "";
    },
    modalBucketHostShow() {
      this.modalBucketHostVisible = true;
    },
    modalBucketHostHide() {
      // 隐藏的时候重新拿数据
      this.getTableList();

      this.modalBucketHostVisible = false;
    },
    getTableList() {
      this.$http({
        method: "GET",
        uri: this.$apiURL + "env",
        resolveWithFullResponse: true,
        headers: {
          token: this.$getUserToken(),
        },
        json: true,
      })
        .then((response) => {
          if (response.body.code == 0) {
            this.data = response.body.data;
            console.log(this.data);
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
