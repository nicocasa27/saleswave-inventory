
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { fetchTopSellingProducts, TopSellingProduct } from "@/services/analytics";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";

type TimeRange = "daily" | "weekly" | "monthly";
type ChartType = "bar" | "pie" | "line" | "area";

export const SalesChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [chartData, setChartData] = useState<TopSellingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<{id: string, nombre: string}[]>([]);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const { toast } = useToast();

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('almacenes')
        .select('id, nombre');
      
      if (error) {
        console.error('Error fetching stores:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las tiendas",
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        setStores(data);
      }
    };
    
    fetchStores();
  }, [toast]);

  // Fetch top selling products based on timeRange and selectedStore
  const fetchProductSalesData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching data with timeRange: ${timeRange}, store: ${selectedStore || 'all'}`);
      const data = await fetchTopSellingProducts(timeRange, selectedStore);
      console.log('Fetched data:', data);
      setChartData(data);
    } catch (error) {
      console.error('Error fetching product sales data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedStore, toast]);

  // Refetch data when timeRange or selectedStore changes
  useEffect(() => {
    fetchProductSalesData();
  }, [timeRange, selectedStore, fetchProductSalesData]);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
  };

  // Handle store selection change
  const handleStoreChange = (value: string) => {
    setSelectedStore(value === "all" ? null : value);
  };

  // Handle chart type change
  const handleChartTypeChange = (value: string) => {
    setChartType(value as ChartType);
  };

  // Colors for the bars
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#FF5733',
    '#C70039',
    '#900C3F'
  ];

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex justify-center items-center h-[280px] text-muted-foreground">
          No hay datos de ventas disponibles
        </div>
      );
    }

    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                animationDuration={1500}
                animationBegin={0}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2 bg-background border border-border rounded-md shadow-md">
                        <p className="font-medium">{payload[0].name}</p>
                        <p className="text-sm">{`${payload[0].value} unidades`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value} unidades`, 'Vendido']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                animationDuration={1500}
                animationBegin={0}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value} unidades`, 'Vendido']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary)/0.2)"
                animationDuration={1500}
                animationBegin={0}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                width={70}
                tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value} unidades`, 'Vendido']}
              />
              <Bar 
                dataKey="value" 
                name="Unidades Vendidas"
                animationDuration={1000}
                animationBegin={0}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Productos Más Vendidos</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={chartType}
            onValueChange={handleChartTypeChange}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Tipo de gráfica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="pie">Pastel</SelectItem>
              <SelectItem value="line">Línea</SelectItem>
              <SelectItem value="area">Área</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedStore || "all"}
            onValueChange={handleStoreChange}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Tienda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Tiendas</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs
            defaultValue="monthly"
            value={timeRange}
            onValueChange={handleTimeRangeChange}
          >
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="daily" className="text-xs">Diario</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">Semanal</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">Mensual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[280px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            {renderChart()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
