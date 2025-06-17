import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailySettingsModalProps {
  onClose: () => void;
}

interface ScheduleSettings {
  warnings: {
    tooManyTelephone: boolean;
    tooFewTelephone: boolean;
    multipleChatUsers: boolean;
  };
  criteria: {
    minTelephoneUsers: number;
    maxTelephoneUsers: number;
    maxChatUsers: number;
  };
}

export default function DailySettingsModal({ onClose }: DailySettingsModalProps) {
  const { toast } = useToast();
  
  const { data: settings } = useQuery<ScheduleSettings>({
    queryKey: ["/api/schedule-settings"],
    initialData: {
      warnings: {
        tooManyTelephone: true,
        tooFewTelephone: true,
        multipleChatUsers: true,
      },
      criteria: {
        minTelephoneUsers: 2,
        maxTelephoneUsers: 6,
        maxChatUsers: 1,
      },
    },
  });

  const [localSettings, setLocalSettings] = useState<ScheduleSettings>(settings!);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ScheduleSettings) => {
      const response = await apiRequest("POST", "/api/schedule-settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-settings"] });
      toast({
        title: "Settings saved",
        description: "Schedule warning settings have been updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleWarningToggle = (warningKey: keyof ScheduleSettings['warnings']) => {
    setLocalSettings(prev => ({
      ...prev,
      warnings: {
        ...prev.warnings,
        [warningKey]: !prev.warnings[warningKey]
      }
    }));
  };

  const handleCriteriaChange = (criteriaKey: keyof ScheduleSettings['criteria'], value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criteriaKey]: value
      }
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">
              Daily Schedule Settings
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Warning Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="too-many-telephone" className="text-sm">
                  Too many people on telephone
                </Label>
                <Switch
                  id="too-many-telephone"
                  checked={localSettings.warnings.tooManyTelephone}
                  onCheckedChange={() => handleWarningToggle('tooManyTelephone')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="too-few-telephone" className="text-sm">
                  Too few people on telephone
                </Label>
                <Switch
                  id="too-few-telephone"
                  checked={localSettings.warnings.tooFewTelephone}
                  onCheckedChange={() => handleWarningToggle('tooFewTelephone')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="multiple-chat" className="text-sm">
                  More than one person in chat
                </Label>
                <Switch
                  id="multiple-chat"
                  checked={localSettings.warnings.multipleChatUsers}
                  onCheckedChange={() => handleWarningToggle('multipleChatUsers')}
                />
              </div>
            </div>
          </div>

          {/* Criteria Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Schedule Criteria</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-telephone" className="text-sm">
                  Minimum telephone users
                </Label>
                <Input
                  id="min-telephone"
                  type="number"
                  min="1"
                  max="10"
                  value={localSettings.criteria.minTelephoneUsers}
                  onChange={(e) => handleCriteriaChange('minTelephoneUsers', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-telephone" className="text-sm">
                  Maximum telephone users
                </Label>
                <Input
                  id="max-telephone"
                  type="number"
                  min="1"
                  max="15"
                  value={localSettings.criteria.maxTelephoneUsers}
                  onChange={(e) => handleCriteriaChange('maxTelephoneUsers', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-chat" className="text-sm">
                  Maximum chat users
                </Label>
                <Input
                  id="max-chat"
                  type="number"
                  min="1"
                  max="5"
                  value={localSettings.criteria.maxChatUsers}
                  onChange={(e) => handleCriteriaChange('maxChatUsers', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}