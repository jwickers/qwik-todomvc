
export type Todo = {
    id: number,
    text: string,
    done?: boolean
}

type TodoToCreate = Omit<Todo, 'id'>
type TodoToUpdate = Partial<TodoToCreate>

type Filter = 'completed' | 'active' | 'all'
type DB = {
    data: Todo[]
    idIncrement: number
    filter: (f: Filter) => Todo[]
    createTodo: (todo: TodoToCreate) => Todo
    getTodo: (id: number) => Todo | undefined
    deleteTodo: (id: number) => void
    updateTodo: (id: number, todo: TodoToUpdate) => Todo
    deleteMany: (predicate: (t: Todo)=>boolean) => void
    updateMany: (predicate: (t: Todo)=>boolean, update: (t: Todo) => Todo) => void
}

export const db: DB = {
    data: [
        {
            id: 1,
            text: "Taste JavaScript",
            done: true  
        },
        {
            id: 2,
            text: "Buy a unicorn"
        }
    ],
    idIncrement: 3,
    filter: (f: Filter) => {
        return f === "completed" ? 
        db.data.filter((t) => t.done) 
        : f === "active" ? db.data.filter((t) => !t.done)
        : db.data;
    },
    createTodo: (todo: TodoToCreate) => {
        const t: Todo = {
            id: db.idIncrement++,
            ...todo
        }
        db.data = [...db.data, t];
        return t;
    },
    getTodo: (id: number) => db.data.find((t) => t.id === id),
    deleteTodo: (id: number) => {
        const t = db.getTodo(id);
        if (!t) throw new Error(`Todo [${id}] not found`)
        db.data = db.data.filter((t) => t.id !== id)
    },
    updateTodo: (id: number, todo: TodoToUpdate) => {
        const t = db.getTodo(id);
        if (!t) throw new Error(`Todo [${id}] not found`)
        const nt = {
            ...t,
            ...todo
        }
        db.data = db.data.map((t) => t.id === id ? nt : t)
        return nt
    },
    deleteMany: (predicate: (t: Todo)=>boolean) => {
        db.data = db.data.filter((t) => !predicate(t))
    },
    updateMany: (predicate: (t: Todo)=>boolean, update: (t: Todo) => Todo) => {
        db.data = db.data.map((t) => predicate(t) ? update(t) : t)
    }
}