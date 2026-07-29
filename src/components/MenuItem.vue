<template>
  <div class="flex items-center rounded-lg bg-gray-200 px-4 py-2">
    <router-link v-if="link" :to="localizedUrl(link)">
      <div class="inline-flex items-center justify-center">
        <span class="material-symbols-outlined text-warmgray-600 mr-2 text-lg">{{ icon }}</span>
        <span class="text-warmgray-600 text-sm font-bold">{{ label }}</span>
      </div>
    </router-link>
    <div v-else class="inline-flex items-center justify-center">
      <span class="material-symbols-outlined text-warmgray-600 mr-2 text-lg">{{ icon }}</span>
      <span class="text-warmgray-600 text-sm font-bold">{{ label }}</span>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  props: {
    link: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { te: hasTranslation, t: translate } = useI18n();
    const label = computed(() => {
      if (hasTranslation(props.title)) {
        return translate(props.title);
      }

      return props.title;
    });

    return {
      label,
    };
  },
});
</script>
