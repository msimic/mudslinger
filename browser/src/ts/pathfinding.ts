  export interface Exit {
    direction_from:string;
    direction_to:string;
    to_vnum:number;
    cost:number;
  }

  export interface Location {
      vnum:number;
      cost:number;
      x:number;
      y:number;
      z:number;
      exits:Exit[];
  }
  
  interface Node<T> {
    key: number
    value: T
  }

  interface PriorityQueue<T> {
    insert(item: T, priority: number): void
    peek(): T
    pop(): T
    size(): number
    isEmpty(): boolean
  }

  export function heuristic(a:Location, b:Location, graph:Graph):number {
    let d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.y - b.y);
    return d * graph.cost(a, b);
  }

  const priorityQueue = <T>(): PriorityQueue<T> => {
    let heap: Node<T>[] = []
  
    const left = (index: number) => 2 * index + 1
    const right = (index: number) =>  2 * index + 2
    const hasLeft = (index: number) => left(index) < heap.length
    const hasRight = (index: number) => right(index) < heap.length
    const parent = (index: number) => Math.floor((index - 1) / 2)

    const swap = (a: number, b: number) => {
      const tmp = heap[a]
      heap[a] = heap[b]
      heap[b] = tmp
    }
    return {
        isEmpty: () => heap.length == 0,
        peek: () => heap.length == 0 ? null : heap[0].value,
        size: () => heap.length,
        insert: (item, prio) => {
            heap.push({key: prio, value: item})
      
            let i = heap.length -1
            while(i > 0) {
              const p = parent(i)
              if(heap[p].key < heap[i].key) break
              const tmp = heap[i]
              heap[i] = heap[p]
              heap[p] = tmp
              i = p
            }
          },
      pop: () => {
        if(heap.length == 0) return null
        
        swap(0, heap.length - 1)
        const item = heap.pop()
  
        let current = 0
        while(hasLeft(current)) {
          let smallerChild = left(current)
          if(hasRight(current) && heap[right(current)].key < heap[left(current)].key) 
            smallerChild = right(current)
  
          if(heap[smallerChild].key > heap[current].key) break
  
          swap(current, smallerChild)
          current = smallerChild
        }
  
        return item.value
      }
    }
  }

  class Graph {
    private edges:Map<Location, Location[]>;
  
    public neighbors(location:Location):Location[] {
      return this.edges.get(location);
    }

    public cost(l1:Location, l2:Location):number {
        return l1.cost + l1.exits.find((ex)=>ex.to_vnum == l2.vnum).cost;
    }

    constructor(locations:Location[]) {
        this.load(locations);
    }

      public load(locations: Location[]) {
          this.edges = new Map<Location, Location[]>();
          for (const loc of locations) {
              const neighbours: Location[] = [];
              for (const exit of loc.exits) {
                  neighbours.push(locations.find((l) => l.vnum == exit.to_vnum));
              }
              this.edges.set(loc, neighbours);
          }
      }
  };

  export function a_star_search
    (graph:Graph,
     start:Location,
     goal:Location,
     came_from:Map<Location, Location>,
     cost_so_far:Map<Location, number>)
  {
    let current:Location;
    let next:Location;
    const frontier = priorityQueue<Location>();
    frontier.insert(start, 0);
  
    came_from.set(start, start);
    cost_so_far.set(start, 0);
    
    while (frontier.size()) {
        current = frontier.pop();
  
      if (current == goal) {
        break;
      }
  
      for (const next of graph.neighbors(current)) {
        const new_cost = cost_so_far.get(current) + graph.cost(current, next);
        if (cost_so_far.has(next)
            || new_cost < cost_so_far.get(next)) {
          cost_so_far.set(next, new_cost);
          const priority = new_cost + heuristic(next, goal, graph);
          frontier.insert(next, priority);
          came_from.set(next, current);
        }
      }
    }
  }

export function reconstruct_path(
   start:Location, goal:Location,
   came_from:Map<Location, Location>
) {
  let path:Location[];
  let current:Location = goal;
  while (current != start) {
    path.push(current);
    current = came_from.get(current);
  }
  path.push(start); // opzionale? la room dove parti, forse da togliere
  path = path.reverse()
  return path;
}