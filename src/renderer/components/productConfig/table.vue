<template>
  <div>
    <a-table
      :scroll="{ y: 600 }"
      :columns="columns"
      :data-source="data"
      rowKey="id"
      :pagination="false"
    >
      <span slot="product_name" slot-scope="text">
        {{ text.name }} - {{ text.name_cn }}
      </span>
    </a-table>
  </div>
</template>

<script>
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
        {
          title: "配置文件路径",
          key: "path",
          dataIndex: "path",
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
    getTableList() {
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
            this.$emit("product-count", response.body.data.length);
            return;
          }
          this.$message.error(response.body.msg);
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
