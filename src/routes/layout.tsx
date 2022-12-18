import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <>
      <Slot />
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Template by Jeremy Wickersheimer</p>
        <p>
          Powered by <a href="http://qwik.builder.io">Qwik</a>
        </p>
        <p>
          Part of <a href="http://todomvc.com">TodoMVC</a>
        </p>
      </footer>
    </>
  );
});
