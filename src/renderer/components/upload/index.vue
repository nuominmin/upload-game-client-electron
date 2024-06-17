<template>
  <div>
    <header>
      <a-row>
        <a-col :span="8">
          <select-directory-upload> </select-directory-upload>
          <build-game-client></build-game-client>
        </a-col>

        <common-menu :span="8" :offset="8" id="upload"></common-menu>
      </a-row>
    </header>

    <table-list></table-list>
  </div>
</template>

<script>
import tableList from "./table";
import commonMenu from "../menu";
import selectDirectoryUpload from "./selectDirectoryUpload";
import buildGameClient from "./buildGameClient";

export default {
  components: {
    tableList,
    commonMenu,
    selectDirectoryUpload,
    buildGameClient,
  },
};
</script>
