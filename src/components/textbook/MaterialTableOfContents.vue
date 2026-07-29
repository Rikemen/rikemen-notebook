<template>
  <section class="material-table-of-contents">
    <form class="material-table-of-contents__form" @submit.prevent="submit">
      <label>
        <span>タイトル</span>
        <input v-model="title" data-testid="toc-title" type="text" />
      </label>
      <label>
        <span>ページ</span>
        <input v-model="page" data-testid="toc-page" min="1" :max="pageCount" type="number" />
      </label>
      <button type="submit">追加</button>
    </form>
    <p v-if="errorMessage" class="material-table-of-contents__error" role="alert">{{ errorMessage }}</p>
    <div class="material-table-of-contents__tree">
      <p v-if="items.length === 0" class="material-table-of-contents__empty">目次はまだありません。</p>
      <ul v-else aria-label="資料の目次" role="tree">
        <MaterialTocTreeItem
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected-page="selectedPage"
          @navigate="$emit('navigate', $event)"
        />
      </ul>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from "vue";
import MaterialTocTreeItem from "@/components/textbook/MaterialTocTreeItem.vue";
import {
  createMaterialTocItem,
  type MaterialTocItem,
} from "@/features/textbook/materialTableOfContents";

const createId = () => globalThis.crypto?.randomUUID?.() ?? `toc-${Date.now()}`;

export default defineComponent({
  name: "MaterialTableOfContents",
  components: {
    MaterialTocTreeItem,
  },
  props: {
    items: {
      required: true,
      type: Array as PropType<MaterialTocItem[]>,
    },
    pageCount: {
      default: undefined,
      type: Number,
    },
    selectedPage: {
      required: true,
      type: Number,
    },
  },
  emits: ["add", "navigate"],
  setup(props, { emit }) {
    const title = ref("");
    const page = ref("1");
    const errorMessage = ref("");

    const submit = () => {
      const result = createMaterialTocItem(
        {
          page: Number(page.value),
          title: title.value,
        },
        props.pageCount,
        createId,
      );

      if (!result.ok) {
        errorMessage.value = result.message;
        return;
      }

      emit("add", result.item);
      title.value = "";
      errorMessage.value = "";
    };

    return {
      errorMessage,
      page,
      submit,
      title,
    };
  },
});
</script>

<style scoped>
.material-table-of-contents {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.material-table-of-contents__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px auto;
  align-items: end;
  gap: var(--space-2);
}

.material-table-of-contents__form label {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.material-table-of-contents__form input {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-inset);
  box-shadow: var(--shadow-inset);
  color: var(--color-text);
  padding: var(--space-2);
}

.material-table-of-contents__form button {
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--color-blue);
  color: white;
  font-weight: 800;
  padding: 0 var(--space-3);
}

.material-table-of-contents__error,
.material-table-of-contents__empty {
  margin: 0;
  font-size: 0.8rem;
}

.material-table-of-contents__error {
  color: var(--color-red);
}

.material-table-of-contents__empty {
  color: var(--color-text-muted);
}

.material-table-of-contents__tree {
  min-height: 0;
  overflow: auto;
}

.material-table-of-contents__tree > ul {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
}

@media (max-width: 767px) {
  .material-table-of-contents__form {
    grid-template-columns: 1fr;
  }
}
</style>
