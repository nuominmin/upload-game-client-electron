<template>
  <div>
    <header>
      <a-row>
        <a-col :span="8">
          <a-button @click="modalOpen" :loading="this.loading">
            添加产品
          </a-button>
          <span href="javascript:;" :style="{ marginLeft: '13px' }">
            产品总数量：{{ productCount }}
          </span>
        </a-col>

        <common-menu :span="8" :offset="8" id="productConfig"></common-menu>
      </a-row>
    </header>

    <a-modal
      title="产品信息"
      :mask="true"
      :visible="this.modalVisible"
      :centered="true"
      :maskClosable="true"
      cancelText="关闭"
      okText="保存"
      width="60vw"
      :confirmLoading="this.modalConfirmLoading"
      @ok="this.modalOK"
      @cancel="this.modalHide"
      :afterClose="this.modalAfterClose"
    >
      <a-input-number
        placeholder="产品id"
        v-model.trim="productID"
        :min="0"
        :autoFocus="true"
      />
      <br />
      <br />
      <a-input
        placeholder="产品名称"
        v-model.trim="productName"
        id="product_name"
        @change="this.modalProductNameChange"
      />
      <br />
      <br />
      <a-input
        placeholder="产品名称(中文)"
        v-model.trim="productNameCn"
        id="product_name_cn"
      />
      <br />
      <br />
      <a-input
        placeholder="配置文件路径"
        v-model.trim="productPath"
        id="product_path"
      />
    </a-modal>

    <table-list @product-count="productCountEvent"></table-list>
  </div>
</template>

<script>
import tableList from "./table";
import commonMenu from "../menu";
export default {
  components: {
    tableList,
    commonMenu,
  },
  data() {
    return {
      loading: false,
      modalConfirmLoading: false,
      modalVisible: false,
      productID: "",
      productName: "",
      productNameCn: "",
      productPath: "",
      productCount: 0,
    };
  },
  methods: {
    productCountEvent(count) {
      this.productCount = count;
    },
    modalProductNameChange() {
      this.productPath = this.productName + "/resource/config/description.json";
    },
    modalOpen() {
      this.loading = true;
      this.modalShow();
    },
    modalOK() {
      if (this.productID == "" || this.productID == null) {
        this.$message.error("产品id不能为空");
        return;
      }

      if (this.productName == "") {
        this.$message.error("产品名称不能为空");
        return;
      }

      if (this.productNameCn == "") {
        this.$message.error("产品名称(中文)不能为空");
        return;
      }

      this.modalConfirmLoading = true;

      this.$http({
        method: "POST",
        uri: this.$apiURL + "save_product",
        resolveWithFullResponse: true,
        formData: {
          id: this.productID,
          name: this.productName,
          name_cn: this.productNameCn,
          path: this.productPath,
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
      this.loading = this.modalConfirmLoading = false;
    },
    modalShow() {
      this.modalVisible = true;
    },
    modalHide() {
      this.modalVisible = false;
    },
  },
};
</script>
