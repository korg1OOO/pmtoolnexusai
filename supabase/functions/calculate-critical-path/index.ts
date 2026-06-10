import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  duration: number
  parent_id: string | null
  is_critical: boolean
  early_start: string | null
  early_finish: string | null
  late_start: string | null
  late_finish: string | null
  free_slack: number
  total_slack: number
}

interface Dependency {
  id: string
  task_id: string
  predecessor_id: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lag: number
}

interface TaskNode {
  task: Task
  predecessors: { dep: Dependency; node: TaskNode }[]
  successors: { dep: Dependency; node: TaskNode }[]
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  freeSlack: number
  totalSlack: number
  isCritical: boolean
}

// Convert date string to day number (days since epoch)
function dateToDay(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24))
}

// Convert day number back to date string
function dayToDate(day: number): string {
  return new Date(day * 1000 * 60 * 60 * 24).toISOString().split('T')[0]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { project_id } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all tasks for the project (excluding summary tasks for CPM)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project_id)
      .neq('type', 'summary')
      .order('sort_order')

    if (tasksError) throw tasksError

    // Fetch all dependencies for tasks in this project
    const taskIds = tasks.map((t: Task) => t.id)
    const { data: dependencies, error: depsError } = await supabase
      .from('task_dependencies')
      .select('*')
      .in('task_id', taskIds)

    if (depsError) throw depsError

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks to process', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build task graph
    const nodeMap = new Map<string, TaskNode>()

    // Initialize nodes
    for (const task of tasks) {
      nodeMap.set(task.id, {
        task,
        predecessors: [],
        successors: [],
        earlyStart: dateToDay(task.start_date),
        earlyFinish: dateToDay(task.end_date),
        lateStart: Infinity,
        lateFinish: Infinity,
        freeSlack: 0,
        totalSlack: 0,
        isCritical: false,
      })
    }

    // Build predecessor/successor relationships
    for (const dep of dependencies || []) {
      const taskNode = nodeMap.get(dep.task_id)
      const predNode = nodeMap.get(dep.predecessor_id)
      
      if (taskNode && predNode) {
        taskNode.predecessors.push({ dep, node: predNode })
        predNode.successors.push({ dep, node: taskNode })
      }
    }

    // Find start nodes (no predecessors)
    const startNodes = Array.from(nodeMap.values()).filter(n => n.predecessors.length === 0)

    // =============================================
    // FORWARD PASS - Calculate Early Start/Finish
    // =============================================
    const visited = new Set<string>()
    const queue = [...startNodes]

    // Initialize start nodes with their actual start dates
    for (const node of startNodes) {
      node.earlyStart = dateToDay(node.task.start_date)
      node.earlyFinish = node.earlyStart + node.task.duration
    }

    while (queue.length > 0) {
      const current = queue.shift()!
      
      if (visited.has(current.task.id)) continue
      
      // Check if all predecessors have been processed
      const allPredsVisited = current.predecessors.every(p => visited.has(p.node.task.id))
      if (!allPredsVisited && current.predecessors.length > 0) {
        queue.push(current)
        continue
      }

      // Calculate early start based on predecessors
      if (current.predecessors.length > 0) {
        let maxEarlyStart = 0
        
        for (const { dep, node: pred } of current.predecessors) {
          let depEarlyStart = 0
          const lag = dep.lag || 0
          
          switch (dep.type) {
            case 'FS': // Finish-to-Start
              depEarlyStart = pred.earlyFinish + lag
              break
            case 'SS': // Start-to-Start
              depEarlyStart = pred.earlyStart + lag
              break
            case 'FF': // Finish-to-Finish (calculate start from finish constraint)
              depEarlyStart = pred.earlyFinish + lag - current.task.duration
              break
            case 'SF': // Start-to-Finish (calculate start from finish constraint)
              depEarlyStart = pred.earlyStart + lag - current.task.duration
              break
          }
          
          maxEarlyStart = Math.max(maxEarlyStart, depEarlyStart)
        }
        
        current.earlyStart = maxEarlyStart
        current.earlyFinish = current.earlyStart + current.task.duration
      }

      visited.add(current.task.id)
      
      // Add successors to queue
      for (const { node: succ } of current.successors) {
        if (!visited.has(succ.task.id)) {
          queue.push(succ)
        }
      }
    }

    // =============================================
    // BACKWARD PASS - Calculate Late Start/Finish
    // =============================================
    
    // Find end nodes (no successors)
    const endNodes = Array.from(nodeMap.values()).filter(n => n.successors.length === 0)
    
    // Find project end (maximum early finish)
    const projectEnd = Math.max(...Array.from(nodeMap.values()).map(n => n.earlyFinish))

    // Initialize end nodes
    for (const node of endNodes) {
      node.lateFinish = projectEnd
      node.lateStart = node.lateFinish - node.task.duration
    }

    // Process in reverse topological order
    const visitedBackward = new Set<string>()
    const backwardQueue = [...endNodes]

    while (backwardQueue.length > 0) {
      const current = backwardQueue.shift()!
      
      if (visitedBackward.has(current.task.id)) continue
      
      // Check if all successors have been processed
      const allSuccsVisited = current.successors.every(s => visitedBackward.has(s.node.task.id))
      if (!allSuccsVisited && current.successors.length > 0) {
        backwardQueue.push(current)
        continue
      }

      // Calculate late finish based on successors
      if (current.successors.length > 0) {
        let minLateFinish = Infinity
        
        for (const { dep, node: succ } of current.successors) {
          let depLateFinish = Infinity
          const lag = dep.lag || 0
          
          switch (dep.type) {
            case 'FS': // Finish-to-Start
              depLateFinish = succ.lateStart - lag
              break
            case 'SS': // Start-to-Start
              depLateFinish = succ.lateStart - lag + current.task.duration
              break
            case 'FF': // Finish-to-Finish
              depLateFinish = succ.lateFinish - lag
              break
            case 'SF': // Start-to-Finish
              depLateFinish = succ.lateFinish - lag
              break
          }
          
          minLateFinish = Math.min(minLateFinish, depLateFinish)
        }
        
        current.lateFinish = minLateFinish
        current.lateStart = current.lateFinish - current.task.duration
      }

      visitedBackward.add(current.task.id)
      
      // Add predecessors to queue
      for (const { node: pred } of current.predecessors) {
        if (!visitedBackward.has(pred.task.id)) {
          backwardQueue.push(pred)
        }
      }
    }

    // =============================================
    // CALCULATE SLACK AND CRITICAL PATH
    // =============================================
    for (const node of nodeMap.values()) {
      node.totalSlack = node.lateStart - node.earlyStart
      
      // Free slack = min(successor early start - current early finish - lag) for FS dependencies
      if (node.successors.length > 0) {
        let minFreeSlack = Infinity
        for (const { dep, node: succ } of node.successors) {
          const lag = dep.lag || 0
          let slack = 0
          
          switch (dep.type) {
            case 'FS':
              slack = succ.earlyStart - node.earlyFinish - lag
              break
            case 'SS':
              slack = succ.earlyStart - node.earlyStart - lag
              break
            case 'FF':
              slack = succ.earlyFinish - node.earlyFinish - lag
              break
            case 'SF':
              slack = succ.earlyFinish - node.earlyStart - lag
              break
          }
          
          minFreeSlack = Math.min(minFreeSlack, slack)
        }
        node.freeSlack = Math.max(0, minFreeSlack)
      } else {
        node.freeSlack = node.totalSlack
      }
      
      // Critical path = total slack is 0
      node.isCritical = node.totalSlack === 0
    }

    // =============================================
    // UPDATE DATABASE
    // =============================================
    const updates = []
    for (const node of nodeMap.values()) {
      updates.push(
        supabase
          .from('tasks')
          .update({
            early_start: dayToDate(node.earlyStart),
            early_finish: dayToDate(node.earlyFinish),
            late_start: dayToDate(node.lateStart),
            late_finish: dayToDate(node.lateFinish),
            free_slack: node.freeSlack,
            total_slack: node.totalSlack,
            is_critical: node.isCritical,
          })
          .eq('id', node.task.id)
      )
    }

    await Promise.all(updates)

    // Return summary
    const criticalTasks = Array.from(nodeMap.values())
      .filter(n => n.isCritical)
      .map(n => ({ id: n.task.id, name: n.task.name }))

    return new Response(
      JSON.stringify({
        success: true,
        updated: nodeMap.size,
        projectEnd: dayToDate(projectEnd),
        criticalPath: criticalTasks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Critical path calculation error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
