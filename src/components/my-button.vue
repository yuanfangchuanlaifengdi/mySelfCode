<template>
  <div>
    <el-button type="primary" v-bind="$attrs" @click="handleClick" :loading="btnLoading">
      <slot></slot>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus'
import { ref, useAttrs } from 'vue'
import type { ButtonAttrs } from '../type'
defineOptions({
  inheritAttrs: false,
})
const btnLoading = ref(false)
const attrs = useAttrs() as ButtonAttrs
const handleClick = async () => {
  try {
    btnLoading.value = true

    await attrs.onClick?.()
  } finally {
    btnLoading.value = false
  }
}
</script>

<style scoped></style>
