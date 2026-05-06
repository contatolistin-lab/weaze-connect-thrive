import { useState, useEffect } from "react";

const fakeUsers = [
  "ana", "carlos", "marina", "joao",
  "fernanda", "lucas", "beatriz", "rafael",
  "juliana", "pedro", "camila", "bruno"
];

export default function LiveSocialProof() {
  const [name, setName] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let showTimeout: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;
    let nextTimeout: NodeJS.Timeout;

    const showNotification = () => {
      const randomName = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      setName(randomName);
      setIsVisible(true);

      showTimeout = setTimeout(() => {
        setIsVisible(false);
        
        nextTimeout = setTimeout(() => {
          setName("");
          showNotification();
        }, 6000 + Math.random() * 4000);
      }, 4000);
    };

    const initialDelay = 3000 + Math.random() * 2000;
    const initialTimeout = setTimeout(showNotification, initialDelay);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      clearTimeout(nextTimeout);
    };
  }, []);

  return (
    <div 
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[220px] max-w-[280px]">
        <div className="flex items-center gap-3 p-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {name ? name.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Novo membro</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {name ? <><span className="text-[#630091]">@</span>{name} entrou na comunidade</> : "..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}