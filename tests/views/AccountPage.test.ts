import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AccountPage from "@/views/Account.vue";

describe("AccountPage", () => {
  it("新規登録とログインの分離画面へ誘導する", () => {
    const wrapper = mount(AccountPage, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("新規登録とログインは別画面に分かれました");
    expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(["/signup", "/login"]);
  });
});
