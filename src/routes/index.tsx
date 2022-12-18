import {
  $,
  component$,
  useOnDocument,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import {
  action$,
  DocumentHead,
  Form,
  Link,
  loader$,
} from "@builder.io/qwik-city";
import { prisma } from "~/db/prisma";

export const todosLoader = loader$(async ({ query }) => {
  const qf = query.get("f");
  console.log("todosLoader::", qf);
  const where =
    qf === "completed"
      ? { done: true }
      : qf === "active"
      ? { done: false }
      : {};
  const filter = qf === "completed" ? qf : qf === "active" ? qf : "all";
  const todos = await prisma.todo.findMany({ where });
  return { todos, filter };
});

export const editTodoAction = action$(async (formData, { fail }) => {
  const text = formData.get("text");
  const id = formData.get("id");
  if (!id) {
    return fail(400, {
      message: "Todo id is required",
    });
  }
  if (!text) {
    return fail(400, {
      message: "Todo text is required",
    });
  }
  await prisma.todo.update({
    where: { id: parseInt(id.toString()) },
    data: { text: text.toString() },
  });
});

export const createTodoAction = action$(async (formData, { fail }) => {
  const text = formData.get("text");
  console.log("createTodoAction::", text);
  if (!text) {
    return fail(400, {
      message: "Todo text is required",
    });
  }
  await prisma.todo.create({ data: { text: text.toString() } });
});

export const deleteTodoAction = action$(async (formData, { fail }) => {
  const id = formData.get("id");
  console.log("deleteTodoAction::", id);
  if (!id) {
    return fail(400, {
      message: "Todo id is required",
    });
  }
  await prisma.todo.delete({ where: { id: parseInt(id.toString()) } });
});

export const markTodoAction = action$(async (formData, { fail }) => {
  const id = formData.get("id");
  const done = formData.get("done");
  console.log("markTodoAction::", id, done);
  if (!id) {
    return fail(400, {
      message: "Todo id is required",
    });
  }
  if (!done || !["y", "n"].includes(done.toString())) {
    return fail(400, {
      message: "Todo new done value is required and must be 'y' or 'n'",
    });
  }
  await prisma.todo.update({
    where: { id: parseInt(id.toString()) },
    data: { done: done.toString() === "y" },
  });
});

export const markAllTodosAction = action$(async (formData) => {
  const done = formData.get("done");
  console.log("markAllTodosAction::", done);
  let flag = true;
  if (done && done.toString() === "n") {
    flag = false;
  }
  await prisma.todo.updateMany({
    where: { done: !flag },
    data: { done: flag },
  });
  return { nextToggle: flag ? "active" : "completed" };
});

export const clearCompletedTodosAction = action$(async () => {
  console.log("clearCompletedTodosAction::");
  await prisma.todo.deleteMany({
    where: { done: true },
  });
});

export default component$(() => {
  const data = todosLoader.use().value;
  const createTodo = createTodoAction.use();
  const editTodo = editTodoAction.use();
  const deleteTodo = deleteTodoAction.use();
  const markTodo = markTodoAction.use();
  const markAllTodos = markAllTodosAction.use();
  const clearCompletedTodos = clearCompletedTodosAction.use();
  const editing = useSignal<number | undefined>();
  const newText = useSignal("");
  const editTodoEl = useSignal<HTMLInputElement>();
  // clear the new todo text input after a successful create is posted
  useTask$(({ track }) => {
    const pending = track(() => createTodo.isPending);
    const status = track(() => createTodo.status);
    if (!pending && status === 200) {
      newText.value = "";
    }
  });
  // reset the editing state after a successful edit is posted
  useTask$(({ track }) => {
    const pending = track(() => editTodo.isPending);
    const status = track(() => editTodo.status);
    if (!pending && status === 200) {
      editing.value = undefined;
    }
  });
  // focus the todo edit text input
  useTask$(({ track }) => {
    const el = track(() => editTodoEl.value);
    if (el) el.focus();
  });

  useOnDocument(
    "keydown",
    $((e) => {
      const event = e as KeyboardEvent;
      if (event.key === "Escape") {
        editing.value = undefined;
      }
    })
  );
  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <Form action={createTodo}>
          <input
            class="new-todo"
            name="text"
            placeholder="What needs to be done?"
            value={newText.value}
            onInput$={(e) => {
              newText.value = (e.target as HTMLInputElement).value;
            }}
            autoFocus
          />
        </Form>
      </header>
      {/* <!-- This section should be hidden by default and shown when there are todos --> */}
      {data.todos && (
        <section class="main">
          <input id="toggle-all" class="toggle-all" type="checkbox" />
          <label
            for="toggle-all"
            onClick$={() => {
              markAllTodos.execute({
                done: markAllTodos.value?.nextToggle === "active" ? "n" : "y",
              });
            }}
          >
            {markAllTodos.value?.nextToggle === "active"
              ? "Mark all as active"
              : "Mark all as complete"}
          </label>
          <ul class="todo-list">
            {/* <!-- These are here just to show the structure of the list items --> */}
            {/* <!-- List items should get the class `editing` when editing and `completed` when marked as completed --> */}
            {data.todos.map((todo) => (
              <li
                class={{
                  completed: todo.done,
                  editing: editing.value === todo.id,
                }}
              >
                <div class="view">
                  <input
                    class="toggle"
                    type="checkbox"
                    checked={todo.done}
                    onClick$={() => {
                      markTodo.execute({
                        id: String(todo.id),
                        done: todo.done ? "n" : "y",
                      });
                    }}
                  />
                  <label
                    onDblClick$={() => {
                      editing.value = todo.id;
                    }}
                  >
                    {todo.text}
                  </label>
                  <button
                    class="destroy"
                    onClick$={() => {
                      deleteTodo.execute({ id: String(todo.id) });
                    }}
                  ></button>
                </div>

                {editing.value === todo.id && (
                  <Form action={editTodo}>
                    <input type="hidden" name="id" value={todo.id} />
                    <input
                      ref={editTodoEl}
                      class="edit"
                      name="text"
                      autoFocus
                      value={todo.text}
                    />
                  </Form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* <!-- This footer should be hidden by default and shown when there are todos --> */}
      {data.todos && (
        <footer class="footer">
          {/* <!-- This should be `0 items left` by default --> */}
          <span class="todo-count">
            <strong>{data.todos.filter((t) => !t.done).length}</strong> item
            {data.todos.filter((t) => !t.done).length > 1 ? "s" : ""} left
          </span>
          {/* <!-- Remove this if you don't implement routing --> */}
          <ul class="filters">
            <li>
              <Link class={{ selected: data.filter === "all" }} href="/">
                All
              </Link>
            </li>
            <li>
              <Link
                class={{ selected: data.filter === "active" }}
                href="/?f=active"
              >
                Active
              </Link>
            </li>
            <li>
              <Link
                class={{ selected: data.filter === "completed" }}
                href="/?f=completed"
              >
                Completed
              </Link>
            </li>
          </ul>
          {/* <!-- Hidden if no completed items are left ↓ --> */}
          {data.todos.some((t) => t.done) && (
            <button
              class="clear-completed"
              onClick$={() => {
                clearCompletedTodos.execute({});
              }}
            >
              Clear completed
            </button>
          )}
        </footer>
      )}
    </section>
  );
});

export const head: DocumentHead = {
  title: "Qwik TodoMVC",
  meta: [
    {
      name: "description",
      content: "Qwik implementation of TodoMVC",
    },
  ],
};
