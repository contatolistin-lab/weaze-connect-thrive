import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useDeviceType } from "@/hooks/use-device-type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function Content() {
  const { tenant } = useTenant();
  const location = useLocation();
  const device = useDeviceType();
  const [tab, setTab] = useState<string>("services");
  const [services, setServices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Auto-select tab based on URL
  useEffect(() => {
    if (location.pathname.includes("/events")) {
      setTab("events");
    } else {
      setTab("services");
    }
  }, [location]);

  // service form
  const [sName, setSName] = useState("");
  const [sDur, setSDur] = useState(60);
  const [sPrice, setSPrice] = useState<string>("");

  // availability
  const [selectedSvc, setSelectedSvc] = useState<string>("");
  const [rules, setRules] = useState<any[]>([]);
  const [rWeekday, setRWeekday] = useState("1");
  const [rStart, setRStart] = useState("09:00");
  const [rEnd, setREnd] = useState("18:00");

  // event form
  const [eTitle, setETitle] = useState("");
  const [eDate, setEDate] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eLimit, setELimit] = useState<string>("");

  const refresh = async () => {
    if (!tenant) return;
    const [{ data: svc }, { data: ev }] = await Promise.all([
      supabase.from("services").select("*").eq("tenant_id", tenant.id).order("created_at"),
      supabase.from("events").select("*").eq("tenant_id", tenant.id).order("date"),
    ]);
    setServices(svc ?? []);
    setEvents(ev ?? []);
    if (selectedSvc) {
      const { data: r } = await supabase.from("availability_rules").select("*").eq("service_id", selectedSvc).order("weekday");
      setRules(r ?? []);
    }
  };
  useEffect(() => { refresh(); }, [tenant?.id]); // eslint-disable-line
  useEffect(() => {
    if (!selectedSvc) { setRules([]); return; }
    supabase.from("availability_rules").select("*").eq("service_id", selectedSvc).order("weekday")
      .then(({ data }) => setRules(data ?? []));
  }, [selectedSvc]);

  const addService = async () => {
    if (!tenant || !sName) return;
    const { error } = await supabase.from("services").insert({
      tenant_id: tenant.id, name: sName, duration_minutes: sDur, price: sPrice ? Number(sPrice) : null,
    });
    if (error) { toast.error(error.message); return; }
    setSName(""); setSPrice(""); refresh(); toast.success("Serviço criado");
  };
  const delService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    refresh();
  };
  const addRule = async () => {
    if (!selectedSvc) { toast.error("Selecione um serviço"); return; }
    const { error } = await supabase.from("availability_rules").insert({
      service_id: selectedSvc, weekday: Number(rWeekday), start_time: rStart, end_time: rEnd,
    });
    if (error) { toast.error(error.message); return; }
    refresh();
  };
  const delRule = async (id: string) => { await supabase.from("availability_rules").delete().eq("id", id); refresh(); };

  const addEvent = async () => {
    if (!tenant || !eTitle || !eDate) return;
    const { error } = await supabase.from("events").insert({
      tenant_id: tenant.id, title: eTitle, description: eDesc || null,
      date: new Date(eDate).toISOString(), capacity_limit: eLimit ? Number(eLimit) : null,
    });
    if (error) { toast.error(error.message); return; }
    setETitle(""); setEDesc(""); setEDate(""); setELimit(""); refresh(); toast.success("Evento criado");
  };
  const delEvent = async (id: string) => { await supabase.from("events").delete().eq("id", id); refresh(); };

  const wDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  return (
    <div className={device === "mobile" ? "max-w-md mx-auto space-y-4 px-2 py-4" : device === "tablet" ? "max-w-3xl mx-auto space-y-6 px-4 py-6" : "max-w-5xl space-y-6"}>
      <div className="flex items-center gap-2">
        <Link to="/feed" className={device === "mobile" ? "p-2 -ml-2" : "hidden md:flex"}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className={device === "mobile" ? "font-display text-2xl" : "font-display text-4xl"}>Conteúdo</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure serviços (agenda) e eventos (inscrições) usados nos CTAs.</p>
        </div>
      </div>

      {device === "mobile" ? (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setTab("services")} className={tab === "services" ? "shrink-0 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium" : "shrink-0 px-4 py-2 bg-secondary text-muted-foreground rounded-full text-sm"}>Serviços</button>
          <button onClick={() => setTab("events")} className={tab === "events" ? "shrink-0 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium" : "shrink-0 px-4 py-2 bg-secondary text-muted-foreground rounded-full text-sm"}>Eventos</button>
        </div>
      ) : (
        <Tabs defaultValue={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="services">Serviços</TabsTrigger><TabsTrigger value="events">Eventos</TabsTrigger></TabsList>
        </Tabs>
      )}

      {tab === "services" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-display text-xl">Novo serviço</CardTitle></CardHeader>
            <CardContent className={device === "mobile" ? "grid grid-cols-1 gap-3" : "grid md:grid-cols-4 gap-3"}>
              <div className={device === "mobile" ? "col-span-1" : "md:col-span-2"}><Label>Nome</Label><Input value={sName} onChange={e => setSName(e.target.value)} /></div>
              <div><Label>Duração (min)</Label><Input type="number" min={15} step={15} value={sDur} onChange={e => setSDur(Number(e.target.value))} /></div>
              <div><Label>Preço</Label><Input type="number" step="0.01" value={sPrice} onChange={e => setSPrice(e.target.value)} /></div>
              <div className={device === "mobile" ? "col-span-1" : "md:col-span-4"}><Button onClick={addService} className="w-full">Criar serviço</Button></div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {services.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.duration_minutes} min{s.price ? ` · R$ ${Number(s.price).toFixed(2)}` : ""}</p></div>
                  <Button variant="ghost" size="icon" onClick={() => delService(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="font-display text-xl">Disponibilidade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedSvc} onValueChange={setSelectedSvc}>
                <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              {selectedSvc && (
                <>
                  <div className={device === "mobile" ? "grid grid-cols-2 gap-2" : "grid grid-cols-4 gap-2"}>
                    <Select value={rWeekday} onValueChange={setRWeekday}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{wDays.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="time" value={rStart} onChange={e => setRStart(e.target.value)} />
                    <Input type="time" value={rEnd} onChange={e => setREnd(e.target.value)} />
                    <Button onClick={addRule}>Adicionar</Button>
                  </div>
                  <div className="space-y-1">
                    {rules.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 text-sm">
                        <span>{wDays[r.weekday]} · {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}</span>
                        <Button variant="ghost" size="icon" onClick={() => delRule(r.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-display text-xl">Novo evento</CardTitle></CardHeader>
            <CardContent className={device === "mobile" ? "grid grid-cols-1 gap-3" : "grid md:grid-cols-2 gap-3"}>
              <div><Label>Título</Label><Input value={eTitle} onChange={e => setETitle(e.target.value)} /></div>
              <div><Label>Data</Label><Input type="datetime-local" value={eDate} onChange={e => setEDate(e.target.value)} /></div>
              <div className={device === "mobile" ? "col-span-1" : "md:col-span-2"}><Label>Descrição</Label><Textarea rows={3} value={eDesc} onChange={e => setEDesc(e.target.value)} /></div>
              <div><Label>Limite de vagas</Label><Input type="number" value={eLimit} onChange={e => setELimit(e.target.value)} /></div>
              <div className={device === "mobile" ? "col-span-1" : "md:col-span-2"}><Button onClick={addEvent} className="w-full">Criar evento</Button></div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {events.map(ev => (
              <Card key={ev.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ev.date).toLocaleString("pt-BR")}{ev.capacity_limit ? ` · ${ev.capacity_limit} vagas` : ""}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => delEvent(ev.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
