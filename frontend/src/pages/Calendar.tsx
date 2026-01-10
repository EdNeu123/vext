import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Phone,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const taskTypes = [
  { id: "call", label: "Ligação", icon: Phone, color: "bg-blue-500" },
  { id: "meeting", label: "Reunião", icon: Users, color: "bg-purple-500" },
  { id: "email", label: "Email", icon: Mail, color: "bg-amber-500" },
  { id: "follow_up", label: "Follow-up", icon: Clock, color: "bg-emerald-500" },
  { id: "other", label: "Outro", icon: CheckCircle, color: "bg-slate-500" },
];

const priorities = [
  { id: "low", label: "Baixa", color: "bg-slate-400" },
  { id: "medium", label: "Média", color: "bg-amber-500" },
  { id: "high", label: "Alta", color: "bg-red-500" },
];

interface Task {
  id: number;
  title: string;
  description: string | null;
  type: "call" | "meeting" | "email" | "follow_up" | "other";
  status: "pending" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate: Date;
  completedAt: Date | null;
  dealId: number | null;
  contactId: number | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function NewTaskDialog({ onSuccess, defaultDate }: { onSuccess: () => void; defaultDate?: Date }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Task["type"]>("call");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState(defaultDate?.toISOString().slice(0, 16) || "");

  const { data: contacts } = trpc.contacts.list.useQuery();
  const { data: deals } = trpc.deals.list.useQuery();
  const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState("");

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setType("call");
      setPriority("medium");
      setDueDate("");
      setContactId("");
      setDealId("");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      toast.error("Preencha título e data");
      return;
    }
    createTask.mutate({
      title,
      description: description || undefined,
      type,
      priority,
      dueDate: new Date(dueDate),
      contactId: contactId ? Number(contactId) : undefined,
      dealId: dealId ? Number(dealId) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ligar para cliente" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as Task["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${t.color}`} />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data e Hora *</Label>
            <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contato</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Oportunidade</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {deals?.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RescheduleDialog({ task, open, onOpenChange, onSuccess }: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [newDate, setNewDate] = useState(task.dueDate.toISOString().slice(0, 16));
  const [reason, setReason] = useState("");

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa reagendada!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error("É obrigatório informar o motivo do reagendamento (compliance)");
      return;
    }
    updateTask.mutate({
      id: task.id,
      dueDate: new Date(newDate),
      reason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              Data atual: {new Date(task.dueDate).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Nova Data e Hora *</Label>
            <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Motivo do Reagendamento * (Compliance)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo do reagendamento..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Este registro será salvo no histórico de auditoria.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending ? "Salvando..." : "Reagendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskItem({ task, onComplete, onReschedule, onDelete }: {
  task: Task;
  onComplete: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}) {
  const typeInfo = taskTypes.find((t) => t.id === task.type);
  const priorityInfo = priorities.find((p) => p.id === task.priority);
  const Icon = typeInfo?.icon || CheckCircle;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
      task.status === "completed" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card hover:shadow-md"
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo?.color || "bg-slate-500"} text-white`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="w-3 h-3" />
          {new Date(task.dueDate).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <Badge className={`${priorityInfo?.color} text-white`}>
        {priorityInfo?.label}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.status !== "completed" && (
            <DropdownMenuItem onClick={onComplete}>
              <CheckCircle className="w-4 h-4 mr-2" /> Concluir
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onReschedule}>
            <CalendarIcon className="w-4 h-4 mr-2" /> Reagendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: monthTasks, isLoading, refetch } = trpc.tasks.getByMonth.useQuery({
    year,
    month,
  });

  const { data: selectedDayTasks, refetch: refetchDay } = trpc.tasks.getByDate.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada!");
      refetch();
      refetchDay();
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa excluída!");
      refetch();
      refetchDay();
    },
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    monthTasks?.forEach((task) => {
      const day = new Date(task.dueDate).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(task);
    });
    return map;
  }, [monthTasks]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const handleComplete = (taskId: number) => {
    updateTask.mutate({ id: taskId, status: "completed" });
  };

  const handleDelete = (taskId: number) => {
    if (confirm("Excluir esta tarefa?")) {
      deleteTask.mutate({ id: taskId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">{monthTasks?.length || 0} tarefas este mês</p>
        </div>
        <NewTaskDialog onSuccess={() => { refetch(); refetchDay(); }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-lg">
              {monthNames[month]} {year}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dayTasks = tasksByDay[day] || [];
                const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg p-1 text-sm transition-all relative ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isToday(day)
                        ? "bg-primary/20 text-primary font-bold"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <span>{day}</span>
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayTasks.slice(0, 3).map((_, idx) => (
                          <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
                : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {selectedDate ? (
              selectedDayTasks && selectedDayTasks.length > 0 ? (
                selectedDayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task.id)}
                    onReschedule={() => setRescheduleTask(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma tarefa para este dia</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Clique em um dia para ver as tarefas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {rescheduleTask && (
        <RescheduleDialog
          task={rescheduleTask}
          open={!!rescheduleTask}
          onOpenChange={(open) => !open && setRescheduleTask(null)}
          onSuccess={() => { refetch(); refetchDay(); }}
        />
      )}
    </div>
  );
}
