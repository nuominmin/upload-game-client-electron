<template>
  <div>
    <header>
      <a-row>
        <common-menu id="envConfig"></common-menu>
      </a-row>
    </header>

    <table-list></table-list>
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
    return {};
  },
  methods: {},
};
</script>
