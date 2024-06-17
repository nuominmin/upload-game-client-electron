<template>
  <div>
    <a-table
      :scroll="{ y: 600 }"
      :columns="columns"
      :data-source="data"
      rowKey="id"
      expandRowByClick
    >
      <a-table
        slot="expandedRowRender"
        slot-scope="text"
        :columns="tableColumns"
        :data-source="text.order"
        :pagination="false"
        rowKey="id"
      >
        <span slot="product" slot-scope="text">
          <template v-if="text.product.length > 0">
            <span
              v-for="(value, key) in text.product"
              :key="key"
              :style="{ width: '130px' }"
            >
              {{ value.name }}
            </span>
          </template>
        </span>

        <span slot="status" slot-scope="text">
          <a-badge
            :status="
              text.status == 2 || text.status == 3
                ? 'processing'
                : text.status == 4
                ? 'warning'
                : text.status == 5
                ? 'success'
                : 'default'
            "
          />
          <a-popover
            placement="topLeft"
            :style="{ cursor: 'context-menu' }"
            v-if="text.bucket.length > 1"
          >
            <template slot="content">
              <p
                v-for="(value, key) in text.bucket"
                :key="key"
                :style="{ width: '130px' }"
              >
                <a-row>
                  <a-col :span="10"> {{ value.storage_desc }}</a-col>
                  <a-col :span="10"> {{ value.status_desc }} </a-col>
                </a-row>
              </p>
            </template>
            {{ text.status_desc }}
          </a-popover>

          <template v-if="text.bucket.length <= 1">
            {{ text.status_desc }}
          </template>
        </span>

        <!-- :data="loading" -->
        <span slot="operation" slot-scope="text" class="table-operation">
          <a-space size="middle">
            <a-button
              type="success"
              @click="syncClient(text.id, text)"
              v-if="text.status == 0"
              :loading="text.syncLoading"
            >
              同步
            </a-button>
            <a-button
              type="success"
              @click="syncClient(text.id, text)"
              v-if="
                (text.status == 4 || text.status == 5) &&
                text.bucket.length <= 1
              "
              :loading="text.syncLoading"
            >
              重新同步
            </a-button>

            <a-button
              type="primary"
              @click.stop="modalReleaseOpen(text)"
              v-if="text.status == 4"
              :loading="text.releaseLoading"
            >
              发布
            </a-button>
            <a-button
              type="primary"
              @click.stop="modalReleaseOpen(text)"
              v-if="text.status == 5"
              :loading="text.releaseLoading"
            >
              重新发布
            </a-button>
          </a-space>
        </span>
      </a-table>
    </a-table>

    <a-modal
      title="更新内容"
      :mask="true"
      :visible="this.modalReleaseVisible"
      :centered="true"
      :maskClosable="true"
      cancelText="关闭"
      okText="提交"
      width="80vw"
      :confirmLoading="this.modalReleaseConfirmLoading"
      @ok="this.modalReleaseOK"
      @cancel="this.modalReleaseHide"
      :afterClose="this.modalReleaseAfterClose"
    >
      <a-textarea
        :autoFocus="true"
        allow-clear
        type="textarea"
        :auto-size="{ minRows: 25 }"
        :style="{ resize: 'none' }"
        v-model="modalReleaseContent"
      />
    </a-modal>
  </div>
</template>

<script>
export default {
  data() {
    return {
      modalReleaseConfirmLoading: false,
      modalReleaseVisible: false,
      modalReleaseContent: "",
      handleRow: null, // 操作的行

      data: [],
      columns: [
        {
          title: "版本",
          key: "version",
          dataIndex: "version",
        },
        { title: "成功数量", dataIndex: "success_count", key: "success_count" },
        {
          title: "失败数量",
          dataIndex: "failures_count",
          key: "failures_count",
        },
      ],
      tableColumns: [
        {
          title: "环境",
          key: "env_desc",
          dataIndex: "env_desc",
        },
        {
          title: "状态",
          key: "status",
          scopedSlots: { customRender: "status" },
        },
        {
          title: "产品",
          key: "product",
          scopedSlots: { customRender: "product" },
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
    modalReleaseAfterClose() {
      this.modalReleaseConfirmLoading = false;
      this.modalReleaseContent = "";
    },
    modalReleaseShow() {
      this.modalReleaseVisible = true;
    },
    modalReleaseHide() {
      // 隐藏的时候重新拿数据
      this.getTableList();
      this.modalReleaseVisible = false;
      this.$set(this.handleRow, "releaseLoading", false);
    },
    modalReleaseOpen(row) {
      this.handleRow = row;
      this.$set(this.handleRow, "releaseLoading", true);
      this.modalReleaseShow();
    },
    modalReleaseOK() {
      this.modalReleaseConfirmLoading = true;
      this.release();
    },
    release() {
      if (this.modalReleaseContent == "") {
        this.modalReleaseConfirmLoading = false;
        this.$message.error("更新内容不能为空");
        return;
      }

      this.$http({
        method: "POST",
        uri: this.$apiURL + "release",
        resolveWithFullResponse: true,
        formData: {
          order_id: this.handleRow.id,
          update_content: this.modalReleaseContent,
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
          this.modalReleaseHide();
        })
        .catch((response) => {
          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
          this.modalReleaseHide();
        });
    },
    syncClient(order_id, row) {
      this.$set(row, "syncLoading", true);
      this.$http({
        method: "POST",
        uri: this.$apiURL + "sync",
        resolveWithFullResponse: true,
        formData: {
          order_id: order_id,
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
          this.$set(row, "syncLoading", false);
        })
        .catch((response) => {
          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
          this.$set(row, "syncLoading", false);
        });
    },
    getTableList() {
      console.log("get table list. ");
      this.$http({
        method: "GET",
        uri: this.$apiURL + "upload_log",
        resolveWithFullResponse: true,
        headers: {
          token: this.$getUserToken(),
        },
        json: true,
      })
        .then((response) => {
          this.$checkResponseAuth(response.body);
          if (response.body.code == 0) {
            this.data = response.body.data;
          }
        })
        .catch((response) => {
          if (response.error != undefined) {
            this.$checkResponseAuth(response.error);
          }

          this.$message.error(
            response.error.msg ? response.error.msg : response.message
          );
        });
    },
  },
};
</script>
