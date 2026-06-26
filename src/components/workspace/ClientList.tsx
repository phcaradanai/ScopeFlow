import { Users, Briefcase, Plus } from 'lucide-react';

interface ClientListProps {
  clientsWithProjects: any[];
  onCreateClient: () => void;
  onCreateProject: (clientId: string) => void;
  onSelectClient: (path: string) => void;
}

export default function ClientList({ clientsWithProjects, onCreateClient, onCreateProject, onSelectClient }: ClientListProps) {
  return (
    <div className="card lg:col-span-2 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-base font-bold text-text flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          ลูกค้าใน Workspace
        </h3>
        <button onClick={onCreateClient} className="btn btn-ghost btn-sm">
          <Plus className="w-3.5 h-3.5" /> เพิ่มลูกค้า
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
        {clientsWithProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-text-dim bg-surface-2/50 border border-border border-dashed rounded-xl">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีข้อมูลลูกค้า</p>
            <button onClick={onCreateClient} className="text-xs text-primary-light hover:underline mt-2 font-medium">
              + สร้างลูกค้ารายแรก
            </button>
          </div>
        ) : (
          clientsWithProjects.map(client => {
            const clientProjCount = client.children?.find((c: any) => c.name === 'projects')?.children?.length || 0;
            const clientId = client.path.split('/').pop() || client.name;
            return (
              <div key={client.path} className="group relative flex flex-col p-5 rounded-2xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-2/80 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateProject(clientId); }}
                    className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-muted hover:bg-primary hover:text-white transition-colors border border-border/50"
                    title="สร้างโครงการใหม่ให้ลูกค้านี้"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => onSelectClient(`__client__:${clientId}`)}
                  className="flex flex-col items-start text-left flex-1"
                >
                  <h4 className="font-bold text-base text-text group-hover:text-primary-light transition-colors line-clamp-1 w-full">
                    {client.name}
                  </h4>
                  <div className="mt-3 flex items-center">
                    <span className="badge badge-muted px-2.5 py-1 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 opacity-70" />
                      {clientProjCount} โครงการ
                    </span>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
