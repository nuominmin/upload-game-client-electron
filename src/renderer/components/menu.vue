<template>
  <a-col
    :span="this.span"
    :offset="this.offset"
    :style="{ textAlign: 'right' }"
  >
    <router-link
      :to="item.id"
      v-for="item in data"
      :key="item.id"
      :style="{ marginRight: '5px' }"
    >
      <a-button
        v-if="item.id == id"
        class="active"
        :style="{ minWidth: '120px' }"
      >
        {{ item.name }}
      </a-button>

      <a-button v-else :style="{ minWidth: '120px' }">
        {{ item.name }}
      </a-button>
    </router-link>
  </a-col>
</template>

<script>
export default {
  data() {
    return {
      data: [],
    };
  },
  mounted() {
    if (this.$getUserSuper() == 1) {
      this.data = [
        {
          id: "upload",
          name: "客户端上传",
        },
        {
          id: "envConfig",
          name: "环境管理",
        },
        {
          id: "productConfig",
          name: "产品配置",
        },
      ];
    }
  },
  props: ["id", "span", "offset"],
};
</script>