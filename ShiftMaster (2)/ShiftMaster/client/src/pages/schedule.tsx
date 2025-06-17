import { useState } from "react";
import Sidebar from "@/components/sidebar";
import TraditionalScheduleGrid from "@/components/traditional-schedule-grid";
import SidePanel from "@/components/side-panel";
import AddEmployeeModal from "@/components/add-employee-modal";
import AddShiftModal from "@/components/add-shift-modal";
import AutoScheduleModal from "@/components/auto-schedule-modal";
import AutoScheduleSettingsModal, { type AutoScheduleSettings } from "@/components/auto-schedule-settings-modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Save, Wand2, Calendar, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SchedulePage() {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [autoScheduleSettings, setAutoScheduleSettings] = useState<AutoScheduleSettings>({
    minAgentsWeekdays: 2,
    minWorkersWeekend: 1,
    // Weekday shift minimums
    minAgents08_16Weekdays: 1,
    minAgents10_18Weekdays: 1,
    minAgents12_20Weekdays: 1,
    // Weekend shift minimums
    minAgents08_16Weekend: 0,
    minAgents10_18Weekend: 1,
    minAgents12_20Weekend: 0,
  });

  const { toast } = useToast();

  const handleSettingsChange = (newSettings: AutoScheduleSettings) => {
    setAutoScheduleSettings(newSettings);
    // You can add additional logic here to apply settings to the auto-schedule algorithm
  };

  const handleExport = async (format: "json" | "csv" = "csv") => {
    try {
      const response = await apiRequest("GET", `/api/export?format=${format}`);
      
      if (format === "csv") {
        const blob = new Blob([await response.text()], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schedule.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schedule.json";
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export successful",
        description: `Schedule exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export schedule data",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: "Changes saved",
      description: "Schedule changes have been saved successfully",
    });
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => 
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    return `${formatDate(startOfWeek)}-${formatDate(endOfWeek)}, ${startOfWeek.getFullYear()}`;
  };

  return (
    <div className="min-h-screen flex bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-neutral-300 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">ShiftMaster</h2>
              <p className="text-neutral-500">Week of {getCurrentWeekRange()}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Button 
                  onClick={() => setIsAutoScheduleModalOpen(true)} 
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto-Schedule
                </Button>
                <Button
                  onClick={() => setIsSettingsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-50 hover:bg-gray-100 border-gray-200 px-2"
                  title="Auto-Schedule Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={() => handleExport("csv")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <TraditionalScheduleGrid 
                onAddEmployee={() => setIsEmployeeModalOpen(true)}
                onAddShift={() => setIsShiftModalOpen(true)}
              />
            </div>
            <div className="space-y-6">
              <SidePanel />
            </div>
          </div>
        </main>
      </div>

      <AddEmployeeModal 
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
      />
      
      <AddShiftModal 
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />
      
      <AutoScheduleModal 
        isOpen={isAutoScheduleModalOpen}
        onClose={() => setIsAutoScheduleModalOpen(false)}
        settings={autoScheduleSettings}
      />
      
      <AutoScheduleSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
