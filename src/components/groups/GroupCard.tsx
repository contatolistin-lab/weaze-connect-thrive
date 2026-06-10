import { useNavigate } from "react-router-dom";
import { Group } from "@/services/groupsService";
import { Users, Lock, Building2, ArrowRight, Share2 } from "lucide-react";

type GroupCardProps = {
  group: Group;
  onDelete: (groupId: string) => void;
  canDelete: boolean;
  imageUrl?: string | null;
  onCopyInvite?: (groupId: string) => void;
};

export function GroupCard({ group, onDelete, canDelete, imageUrl, onCopyInvite }: GroupCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-4 border shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/groups/${group.id}`)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          {imageUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                group.type === "private" ? "bg-purple-100" : "bg-blue-100"
              }`}
            >
              {group.type === "private" ? (
                <Lock className="h-5 w-5 text-purple-600" />
              ) : (
                <Building2 className="h-5 w-5 text-blue-600" />
              )}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{group.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <Users className="h-3 w-3" />
              <span>
                {group.members_count !== undefined
                  ? `${group.members_count} membro${group.members_count !== 1 ? "s" : ""}`
                  : group.type === "private"
                  ? "Privado"
                  : "Interno"}
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {onCopyInvite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyInvite(group.id);
              }}
              className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
              title="Compartilhar convite"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => navigate(`/groups/${group.id}`)}
            className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
            title="Abrir grupo"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(group.id);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}