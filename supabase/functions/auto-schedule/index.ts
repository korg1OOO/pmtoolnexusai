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
  type: string
  constraint_type: string | null
  constraint_date: string | null
  manually_scheduled: boolean | null
  calendar_id: string | null
}

interface Dependency {
  id: string
  task_id: string
  predecessor_id: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lag: number
}

interface Calendar {
  id: string
  working_days: {
    mon: boolean
    tue: boolean
    wed: boolean
    thu: boolean
    fri: boolean
    sat: boolean
    sun: boolean
  }
  work_hours: {
    start: string
    end: string
    hours_per_day: number
  }
}

interface CalendarException {
  calendar_id: string
  start_date: string
  end_date: string
  exception_type: string
}

interface ScheduleNode {
  task: Task
  predecessors: { dep: Dependency; node: ScheduleNode }[]
  successors: { dep: Dependency; node: ScheduleNode }[]
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  scheduledStart: number
  scheduledFinish: number
}

// Day names for working day check
const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

// Default working days (Mon-Fri)
const defaultWorkingDays = {
  mon: true, tue: true, wed: true, thu: true, fri: true,
  sat: false, sun: false
}

// Convert date string to day number
function dateToDay(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24))
}

// Convert day number to date string
function dayToDate(day: number): string {
  return new Date(day * 1000 * 60 * 60 * 24).toISOString().split('T')[0]
}

// Check if a day is a working day
function isWorkingDay(
  day: number,
  calendar: Calendar | null,
  exceptions: CalendarException[]
): boolean {
  const dateStr = dayToDate(day)
  const date = new Date(day * 1000 * 60 * 60 * 24)
  
  // Check exceptions
  for (const exc of exceptions) {
    if (dateStr >= exc.start_date && dateStr <= exc.end_date) {
      return exc.exception_type === 'working'
    }
  }
  
  // Check regular working days
  const dayOfWeek = dayNames[date.getUTCDay()]
  const workingDays = calendar?.working_days || defaultWorkingDays
  return workingDays[dayOfWeek]
}

// Add working days to a day number
function addWorkingDays(
  startDay: number,
  duration: number,
  calendar: Calendar | null,
  exceptions: CalendarException[]
): number {
  if (duration <= 0) return startDay
  
  let current = startDay
  let added = 0
  
  while (added < duration - 1) {
    current++
    if (isWorkingDay(current, calendar, exceptions)) {
      added++
    }
  }
  
  return current
}

// Get next working day
function getNextWorkingDay(
  day: number,
  calendar: Calendar | null,
  exceptions: CalendarException[]
): number {
  let current = day
  while (!isWorkingDay(current, calendar, exceptions)) {
    current++
  }
  return current
}

// Calculate working days between two days
function workingDaysBetween(
  startDay: number,
  endDay: number,
  calendar: Calendar | null,
  exceptions: CalendarException[]
): number {
  let count = 0
  for (let d = startDay; d <= endDay; d++) {
    if (isWorkingDay(d, calendar, exceptions)) count++
  }
  return Math.max(1, count)
}

// Apply constraint to calculated dates
function applyConstraint(
  calculatedStart: number,
  calculatedFinish: number,
  task: Task,
  calendar: Calendar | null,
  exceptions: CalendarException[]
): { start: number; finish: number } {
  const constraintType = task.constraint_type || 'ASAP'
  const constraintDay = task.constraint_date ? dateToDay(task.constraint_date) : null
  
  let start = calculatedStart
  let finish = calculatedFinish
  
  switch (constraintType) {
    case 'MSO': // Must Start On
      if (constraintDay !== null) {
        start = getNextWorkingDay(constraintDay, calendar, exceptions)
        finish = addWorkingDays(start, task.duration, calendar, exceptions)
      }
      break
      
    case 'MFO': // Must Finish On
      if (constraintDay !== null) {
        finish = getNextWorkingDay(constraintDay, calendar, exceptions)
        start = finish - task.duration + 1
        start = getNextWorkingDay(start, calendar, exceptions)
      }
      break
      
    case 'SNET': // Start No Earlier Than
      if (constraintDay !== null && calculatedStart < constraintDay) {
        start = getNextWorkingDay(constraintDay, calendar, exceptions)
        finish = addWorkingDays(start, task.duration, calendar, exceptions)
      }
      break
      
    case 'SNLT': // Start No Later Than
      if (constraintDay !== null && calculatedStart > constraintDay) {
        start = getNextWorkingDay(constraintDay, calendar, exceptions)
        finish = addWorkingDays(start, task.duration, calendar, exceptions)
      }
      break
      
    case 'FNET': // Finish No Earlier Than
      if (constraintDay !== null && calculatedFinish < constraintDay) {
        finish = getNextWorkingDay(constraintDay, calendar, exceptions)
        start = finish - task.duration + 1
      }
      break
      
    case 'FNLT': // Finish No Later Than
      if (constraintDay !== null && calculatedFinish > constraintDay) {
        finish = getNextWorkingDay(constraintDay, calendar, exceptions)
        start = finish - task.duration + 1
      }
      break
  }
  
  return { start, finish }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { project_id, changed_task_id, recalculate_all } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch tasks (excluding summary tasks)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project_id)
      .neq('type', 'summary')
      .order('sort_order')

    if (tasksError) throw tasksError

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks to schedule', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch dependencies
    const taskIds = tasks.map((t: Task) => t.id)
    const { data: dependencies, error: depsError } = await supabase
      .from('task_dependencies')
      .select('*')
      .in('task_id', taskIds)

    if (depsError) throw depsError

    // Fetch default calendar
    const { data: calendars } = await supabase
      .from('project_calendars')
      .select('*')
      .eq('project_id', project_id)
      .eq('is_default', true)
      .limit(1)

    const calendar = calendars?.[0] as Calendar | null

    // Fetch calendar exceptions
    const { data: exceptions } = await supabase
      .from('calendar_exceptions')
      .select('*')
      .eq('calendar_id', calendar?.id || '')

    const calendarExceptions = (exceptions || []) as CalendarException[]

    // Build task graph
    const nodeMap = new Map<string, ScheduleNode>()

    for (const task of tasks) {
      nodeMap.set(task.id, {
        task,
        predecessors: [],
        successors: [],
        earlyStart: dateToDay(task.start_date),
        earlyFinish: dateToDay(task.end_date),
        lateStart: Infinity,
        lateFinish: Infinity,
        scheduledStart: dateToDay(task.start_date),
        scheduledFinish: dateToDay(task.end_date),
      })
    }

    // Build relationships
    for (const dep of dependencies || []) {
      const taskNode = nodeMap.get(dep.task_id)
      const predNode = nodeMap.get(dep.predecessor_id)
      if (taskNode && predNode) {
        taskNode.predecessors.push({ dep, node: predNode })
        predNode.successors.push({ dep, node: taskNode })
      }
    }

    // Find start nodes
    const startNodes = Array.from(nodeMap.values()).filter(
      n => n.predecessors.length === 0 || n.task.manually_scheduled
    )

    // ===== FORWARD PASS =====
    const visited = new Set<string>()
    const queue = [...startNodes]

    for (const node of startNodes) {
      const start = getNextWorkingDay(
        dateToDay(node.task.start_date),
        calendar,
        calendarExceptions
      )
      node.earlyStart = start
      node.earlyFinish = addWorkingDays(start, node.task.duration, calendar, calendarExceptions)
      node.scheduledStart = node.earlyStart
      node.scheduledFinish = node.earlyFinish
    }

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.task.id)) continue

      const allPredsVisited = current.predecessors.every(p => visited.has(p.node.task.id))
      if (!allPredsVisited && current.predecessors.length > 0) {
        queue.push(current)
        continue
      }

      if (current.task.manually_scheduled) {
        visited.add(current.task.id)
        for (const { node: succ } of current.successors) {
          if (!visited.has(succ.task.id)) queue.push(succ)
        }
        continue
      }

      if (current.predecessors.length > 0) {
        let maxEarlyStart = 0

        for (const { dep, node: pred } of current.predecessors) {
          const lag = dep.lag || 0
          let depStart = 0

          switch (dep.type) {
            case 'FS':
              depStart = pred.scheduledFinish + 1 + lag
              break
            case 'SS':
              depStart = pred.scheduledStart + lag
              break
            case 'FF':
              depStart = pred.scheduledFinish + lag - current.task.duration + 1
              break
            case 'SF':
              depStart = pred.scheduledStart + lag - current.task.duration + 1
              break
          }

          depStart = getNextWorkingDay(depStart, calendar, calendarExceptions)
          maxEarlyStart = Math.max(maxEarlyStart, depStart)
        }

        current.earlyStart = maxEarlyStart
        current.earlyFinish = addWorkingDays(
          maxEarlyStart,
          current.task.duration,
          calendar,
          calendarExceptions
        )

        const constrained = applyConstraint(
          current.earlyStart,
          current.earlyFinish,
          current.task,
          calendar,
          calendarExceptions
        )

        current.scheduledStart = constrained.start
        current.scheduledFinish = constrained.finish
      }

      visited.add(current.task.id)

      for (const { node: succ } of current.successors) {
        if (!visited.has(succ.task.id)) queue.push(succ)
      }
    }

    // ===== BACKWARD PASS =====
    const endNodes = Array.from(nodeMap.values()).filter(n => n.successors.length === 0)
    const projectEnd = Math.max(...Array.from(nodeMap.values()).map(n => n.scheduledFinish))

    for (const node of endNodes) {
      node.lateFinish = projectEnd
      node.lateStart = node.lateFinish - node.task.duration + 1
    }

    const visitedBack = new Set<string>()
    const backQueue = [...endNodes]

    while (backQueue.length > 0) {
      const current = backQueue.shift()!
      if (visitedBack.has(current.task.id)) continue

      const allSuccsVisited = current.successors.every(s => visitedBack.has(s.node.task.id))
      if (!allSuccsVisited && current.successors.length > 0) {
        backQueue.push(current)
        continue
      }

      if (current.successors.length > 0) {
        let minLateFinish = Infinity

        for (const { dep, node: succ } of current.successors) {
          const lag = dep.lag || 0
          let depLateFinish = Infinity

          switch (dep.type) {
            case 'FS':
              depLateFinish = succ.lateStart - 1 - lag
              break
            case 'SS':
              depLateFinish = succ.lateStart - lag + current.task.duration - 1
              break
            case 'FF':
              depLateFinish = succ.lateFinish - lag
              break
            case 'SF':
              depLateFinish = succ.lateFinish - lag
              break
          }

          minLateFinish = Math.min(minLateFinish, depLateFinish)
        }

        current.lateFinish = minLateFinish
        current.lateStart = current.lateFinish - current.task.duration + 1
      }

      visitedBack.add(current.task.id)

      for (const { node: pred } of current.predecessors) {
        if (!visitedBack.has(pred.task.id)) backQueue.push(pred)
      }
    }

    // ===== UPDATE DATABASE =====
    const scheduledTasks: { id: string; name: string; start: string; end: string }[] = []

    for (const node of nodeMap.values()) {
      const totalSlack = node.lateStart - node.earlyStart
      
      let freeSlack = totalSlack
      if (node.successors.length > 0) {
        let minGap = Infinity
        for (const { dep, node: succ } of node.successors) {
          const gap = succ.scheduledStart - node.scheduledFinish - 1 - (dep.lag || 0)
          minGap = Math.min(minGap, gap)
        }
        freeSlack = Math.max(0, minGap)
      }

      const isCritical = totalSlack <= 0

      await supabase
        .from('tasks')
        .update({
          start_date: dayToDate(node.scheduledStart),
          end_date: dayToDate(node.scheduledFinish),
          early_start: dayToDate(node.earlyStart),
          early_finish: dayToDate(node.earlyFinish),
          late_start: dayToDate(node.lateStart),
          late_finish: dayToDate(node.lateFinish),
          total_slack: Math.max(0, totalSlack),
          free_slack: Math.max(0, freeSlack),
          is_critical: isCritical,
        })
        .eq('id', node.task.id)

      scheduledTasks.push({
        id: node.task.id,
        name: node.task.name,
        start: dayToDate(node.scheduledStart),
        end: dayToDate(node.scheduledFinish),
      })
    }

    // Also update summary tasks by aggregating children
    const summaryTasks = (await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'summary')).data || []

    for (const summary of summaryTasks) {
      const children = tasks.filter((t: Task) => t.parent_id === summary.id)
      if (children.length === 0) continue

      const childNodes = children.map((c: Task) => nodeMap.get(c.id)).filter(Boolean) as ScheduleNode[]
      if (childNodes.length === 0) continue

      const minStart = Math.min(...childNodes.map(n => n.scheduledStart))
      const maxEnd = Math.max(...childNodes.map(n => n.scheduledFinish))
      const duration = workingDaysBetween(minStart, maxEnd, calendar, calendarExceptions)

      await supabase
        .from('tasks')
        .update({
          start_date: dayToDate(minStart),
          end_date: dayToDate(maxEnd),
          duration,
        })
        .eq('id', summary.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: nodeMap.size,
        projectEnd: dayToDate(projectEnd),
        tasks: scheduledTasks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Auto-scheduling error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
