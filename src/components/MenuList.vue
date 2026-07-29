<template>
  <div class="flex flex-col space-y-1 bg-white p-4">
    <MenuItem link="/" icon="home" title="HOME" @click="handleClose" />
    <MenuItem v-if="!store.user" link="/signup" icon="person_add" title="新規登録" @click="handleClose" />
    <MenuItem v-if="!store.user" link="/login" icon="login" title="ログイン" @click="handleClose" />

    <MenuItem v-if="store.user" link="/notes" icon="book" title="マイノート" @click="handleClose" />

    <MenuItem v-if="store.user" icon="add_circle_outline" title="menu.signout" @click="logout" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/store/index";
import { auth } from "@/utils/firebase";
import { signOut } from "firebase/auth";

import MenuItem from "@/components/MenuItem.vue";

const emitClose = "close-menu";

export default defineComponent({
  components: {
    MenuItem,
  },
  emits: [emitClose],
  setup(__, ctx) {
    const store = useStore();
    const handleClose = () => {
      ctx.emit(emitClose);
    };
    const logout = () => {
      signOut(auth);
      ctx.emit(emitClose);
    };
    return {
      handleClose,
      logout,
      store,
    };
  },
});
</script>
