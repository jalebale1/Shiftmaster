import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { ShiftTemplate } from "@shared/schema";

interface Analytics {
  totalHours: number;
  coverage: number;
  conflicts: number;
  employees: number;
}

export default function SidePanel() {
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });



  const { data: shiftTemplates = [] } = useQuery<ShiftTemplate[]>({
    queryKey: ["/api/shift-templates"],
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Total Hours</span>
              <span className="font-semibold text-neutral-900">
                {analytics?.totalHours || 0}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Coverage</span>
              <span className="font-semibold text-green-600">
                {analytics?.coverage || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Conflicts</span>
              <span className="font-semibold text-red-600">
                {analytics?.conflicts || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Employees</span>
              <span className="font-semibold text-neutral-900">
                {analytics?.employees || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Shift Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Shift Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shiftTemplates.map((template) => (
              <div
                key={template.id}
                className="p-2 border border-neutral-300 rounded-lg cursor-move hover:shadow-sm transition-shadow"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("template", JSON.stringify(template));
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-900">
                    {template.name}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {template.duration}h
                  </span>
                </div>
                <div className="text-xs text-neutral-600">
                  {template.startTime} - {template.endTime}
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full mt-3" size="sm">
              <span className="text-xs">+ Create Template</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Alert */}
      {analytics && analytics.conflicts > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Schedule Conflicts Detected</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {analytics.conflicts} employees have overlapping shifts that need attention.
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-yellow-800 underline">
                  Resolve Conflicts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
