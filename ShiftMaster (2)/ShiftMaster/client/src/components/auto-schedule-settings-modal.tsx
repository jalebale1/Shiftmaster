import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

interface AutoScheduleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AutoScheduleSettings) => void;
}

export interface AutoScheduleSettings {
  minAgentsWeekdays: number;
  minWorkersWeekend: number;
  // Weekday shift minimums
  minAgents08_16Weekdays: number;
  minAgents10_18Weekdays: number;
  minAgents12_20Weekdays: number;
  // Weekend shift minimums
  minAgents08_16Weekend: number;
  minAgents10_18Weekend: number;
  minAgents12_20Weekend: number;
}

const settingsSchema = z.object({
  minAgentsWeekdays: z.number().min(1, "Must have at least 1 agent during weekdays").max(10, "Maximum 10 agents"),
  minWorkersWeekend: z.number().min(1, "Must have at least 1 worker during weekend").max(10, "Maximum 10 workers"),
  // Weekday shift minimums
  minAgents08_16Weekdays: z.number().min(0, "Minimum 0 agents").max(5, "Maximum 5 agents"),
  minAgents10_18Weekdays: z.number().min(0, "Minimum 0 agents").max(5, "Maximum 5 agents"),
  minAgents12_20Weekdays: z.number().min(0, "Minimum 0 agents").max(5, "Maximum 5 agents"),
  // Weekend shift minimums
  minAgents08_16Weekend: z.number().min(0, "Minimum 0 agents").max(5, "Maximum 5 agents"),
  minAgents10_18Weekend: z.number().min(0, "Minimum 0 agents").max(5, "Maximum 5 agents"),
  minAgents12_20Weekend: z.number().min(0, "Minimum 0 agents").max(5, "Maximum 5 agents"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS: AutoScheduleSettings = {
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
};

export default function AutoScheduleSettingsModal({ 
  isOpen, 
  onClose, 
  onSettingsChange 
}: AutoScheduleSettingsModalProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutoScheduleSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('autoScheduleSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.warn('Failed to parse saved settings, using defaults');
      }
    }
  }, []);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  // Update form when settings change
  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = (data: SettingsForm) => {
    const newSettings: AutoScheduleSettings = {
      minAgentsWeekdays: data.minAgentsWeekdays,
      minWorkersWeekend: data.minWorkersWeekend,
      // Weekday shift minimums
      minAgents08_16Weekdays: data.minAgents08_16Weekdays,
      minAgents10_18Weekdays: data.minAgents10_18Weekdays,
      minAgents12_20Weekdays: data.minAgents12_20Weekdays,
      // Weekend shift minimums
      minAgents08_16Weekend: data.minAgents08_16Weekend,
      minAgents10_18Weekend: data.minAgents10_18Weekend,
      minAgents12_20Weekend: data.minAgents12_20Weekend,
    };

    // Save to localStorage
    localStorage.setItem('autoScheduleSettings', JSON.stringify(newSettings));
    
    // Update state
    setSettings(newSettings);
    
    // Notify parent component
    onSettingsChange(newSettings);

    toast({
      title: "Settings Saved",
      description: "Auto-schedule settings have been updated successfully",
    });

    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    form.reset(DEFAULT_SETTINGS);
    localStorage.removeItem('autoScheduleSettings');
    
    toast({
      title: "Settings Reset",
      description: "Auto-schedule settings have been reset to defaults",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Auto-Schedule Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure parameters that control how the Auto-Schedule function generates shift combinations.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Minimum Agents During Weekdays */}
            <FormField
              control={form.control}
              name="minAgentsWeekdays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Minimum Agents During Work Week
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="w-full"
                    />
                  </FormControl>
                  <div className="text-xs text-gray-600">
                    Minimum number of agents required during Monday-Friday
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Minimum Workers During Weekend */}
            <FormField
              control={form.control}
              name="minWorkersWeekend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Minimum Workers During Weekend
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="w-full"
                    />
                  </FormControl>
                  <div className="text-xs text-gray-600">
                    Minimum number of workers required during Saturday-Sunday
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weekday Shift Minimums */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                Weekday Shift Minimums (Monday-Friday)
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="minAgents08_16Weekdays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">08:00-16:00</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minAgents10_18Weekdays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">10:00-18:00</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minAgents12_20Weekdays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">12:00-20:00</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Weekend Shift Minimums */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                Weekend Shift Minimums (Saturday-Sunday)
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="minAgents08_16Weekend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">08:00-16:00</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minAgents10_18Weekend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">10:00-18:00</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minAgents12_20Weekend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">12:00-20:00</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Current Settings Display */}
            <div className="bg-gray-50 p-3 rounded-md border">
              <div className="text-sm font-medium text-gray-800 mb-2">Current Settings:</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>• Weekdays: {settings.minAgentsWeekdays} agents minimum</div>
                <div>• Weekend: {settings.minWorkersWeekend} workers minimum</div>
                <div className="mt-2 font-medium">Weekday Shifts:</div>
                <div>  - 08:00-16:00: {settings.minAgents08_16Weekdays} agents</div>
                <div>  - 10:00-18:00: {settings.minAgents10_18Weekdays} agents</div>
                <div>  - 12:00-20:00: {settings.minAgents12_20Weekdays} agents</div>
                <div className="mt-2 font-medium">Weekend Shifts:</div>
                <div>  - 08:00-16:00: {settings.minAgents08_16Weekend} agents</div>
                <div>  - 10:00-18:00: {settings.minAgents10_18Weekend} agents</div>
                <div>  - 12:00-20:00: {settings.minAgents12_20Weekend} agents</div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Reset to Defaults
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}