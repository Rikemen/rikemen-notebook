import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import Layout from "@/components/Layout.vue";
import Blank from "@/components/Blank.vue";
import NotFound from "@/components/NotFound.vue";

import Home from "@/views/Home.vue";
import Account from "@/views/Account.vue";
import About from "@/views/About.vue";
import MyPage from "@/views/MyPage.vue";
import Login from "@/views/Login.vue";
import NotesListView from "@/views/NotesListView.vue";
import SignUp from "@/views/SignUp.vue";
import WorkspaceView from "@/views/WorkspaceView.vue";

export const routeChildren: Array<RouteRecordRaw> = [
  {
    path: "",
    component: Home,
  },
  {
    path: "about",
    component: About,
  },
  {
    path: "account",
    component: Account,
  },
  {
    path: "signup",
    component: SignUp,
  },
  {
    path: "login",
    component: Login,
  },
  {
    path: "mypage",
    component: MyPage,
  },
  {
    path: "notes",
    component: NotesListView,
    meta: {
      requiresPersistentUserData: true,
    },
  },
  {
    path: "notes/:noteId",
    component: WorkspaceView,
    meta: {
      requiresPersistentUserData: true,
      workspace: true,
    },
  },
];
export const routes: Array<RouteRecordRaw> = [
  {
    path: "/:lang(en|ja)/:rest(.*)",
    redirect: (to) => {
      const { rest } = to.params;
      if (Array.isArray(rest)) {
        return `/${rest.join("/")}`;
      }

      return `/${String(rest ?? "")}`;
    },
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        component: Blank,
        children: routeChildren,
      },
    ],
  },
  {
    path: "/:page(.*)",
    name: "NotFoundPage",
    component: NotFound,
  },
];
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
