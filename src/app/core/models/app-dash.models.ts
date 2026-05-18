export interface AppDashResponse<T> {
  success:   boolean;
  message?:  string;
  data:      T;
  timestamp: number;
}

export interface AppDashPageResponse<T> {
  content:    T[];
  page:       number;
  size:       number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
}

export interface AppDashKpiDto {
  label:          string;
  value:          string;
  rawValue:       number;
  changePercent:  number;
  changePositive: boolean;
  sparkline:      number[];
}

export interface AppDashClientDto {
  clientId:        number;
  name:            string;
  description?:    string;
  imageUrl?:       string;
  segmentId?:      number;
  segmentName?:    string;
  totalOutlets:    number;
  ordersThisMonth: number;
  avgRating:       number;
  createdTime?:    string;
}

export interface AppDashAddressDto {
  addressId?:     number;
  outletId?:      number;
  userId?:        number;
  locationId?:    number;
  doorNo?:        string;
  buildingName?:  string;
  addressLine1?:  string;
  addressLine2?:  string;
  city?:          string;
  state?:         string;
  zipCode?:       string;
  country?:       string;
  latitude?:      number;
  longitude?:     number;
  type?:          string;
  instructions?:  string;
  label?:         string;
  receiverName?:  string;
  receiverPhone?: string;
  favorite?:      boolean;
}

export interface AppDashOutletDto {
  outletId:          number;
  clientId:          number;
  clientName?:       string;
  name:              string;
  description?:      string;
  type?:             string;
  outletUri?:        string;
  isVeg:             boolean;
  isPickupAvailable: boolean;
  imageUrl?:         string;
  address?:          AppDashAddressDto;
  ordersToday:       number;
  ordersThisMonth:   number;
  avgRating:         number;
  ratingCount:       number;
  createdTime?:      string;
}

export interface AppDashCategoryDto {
  categoryId:      number;
  name:            string;
  description?:    string;
  imageUrl?:       string;
  outletId:        number;
  segmentId?:      number;
  itemCount:       number;
  activeItemCount: number;
  orderCount:      number;
}

export interface AppDashItemDto {
  itemId:        number;
  outletId:      number;
  categoryId:    number;
  name:          string;
  description?:  string;
  imageUrl?:     string;
  price:         number;
  available:     boolean;
  type:          'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG';
  categoryName?: string;
  ordersToday:   number;
  avgRating:     number;
}

export interface AppDashRatingDto {
  ratingId:      number;
  userId?:       number;
  targetType:    string;
  targetId:      number;
  score:         number;
  comment?:      string;
  createdAt?:    string;
  userName?:     string;
  userInitials?: string;
}

export interface AppDashRatingSummaryDto {
  avgRating:     number;
  totalReviews:  number;
  breakdown:     Record<number, number>;
  recentReviews: AppDashRatingDto[];
}

export interface AppDashLiveOrderDto {
  orderId:       number;
  orderCode:     string;
  customerName?: string;
  itemsSummary?: string;
  totalAmount:   number;
  statusCode:    number;
  statusLabel:   string;
  createdTime?:  string;
}

export interface AppDashTopItemDto {
  itemId:        number;
  name:          string;
  categoryName?: string;
  imageUrl?:     string;
  ordersToday:   number;
  maxOrders:     number;
}

export interface AppDashWeeklyOrderDto {
  day:        string;
  date:       string;
  orderCount: number;
  revenue:    number;
}

export interface AppDashDeliveryMetricsDto {
  onTimePercent:      number;
  avgDeliveryMinutes: number;
  fastestMinutes:     number;
  cancelledToday:     number;
  activeRiders:       number;
}

export interface AppDashRevenueBreakdownDto {
  foodOrders:   number;
  deliveryFees: number;
  tips:         number;
  total:        number;
}

export interface AppDashActivityEventDto {
  eventType: string;
  text:      string;
  timeAgo:   string;
  timestamp: string;
}

export interface AppDashOutletDashboardDto {
  ordersToday:        AppDashKpiDto;
  revenueToday:       AppDashKpiDto;
  avgDeliveryMinutes: AppDashKpiDto;
  avgRating:          AppDashKpiDto;
  activeOrders:       number;
  activeRiders:       number;
  liveOrders:         AppDashLiveOrderDto[];
  weeklyOrders:       AppDashWeeklyOrderDto[];
  ratingSummary:      AppDashRatingSummaryDto;
  topItems:           AppDashTopItemDto[];
  deliveryMetrics:    AppDashDeliveryMetricsDto;
  revenueBreakdown:   AppDashRevenueBreakdownDto;
  recentActivity:     AppDashActivityEventDto[];
}

export interface AppDashGlobalStatsDto {
  ordersToday:       AppDashKpiDto;
  totalRevenue:      AppDashKpiDto;
  activeOutlets:     AppDashKpiDto;
  newUsers:          AppDashKpiDto;
  avgOrderValue:     number;
  totalClients:      number;
  totalOffers:       number;
  platformAvgRating: number;
  dailyOrders:       AppDashWeeklyOrderDto[];
  revenueByCity:     AppDashCityRevenueDto[];
  topOutlets:        AppDashOutletSummaryDto[];
}

export interface AppDashCityRevenueDto {
  city:       string;
  revenue:    number;
  orderCount: number;
}

export interface AppDashOutletSummaryDto {
  outletId:    number;
  name:        string;
  clientName?: string;
  city?:       string;
  ordersToday: number;
  revenue:     number;
  avgRating:   number;
  status?:     string;
}

export interface AppDashSegmentDto {
  segmentId:    number;
  name:         string;
  description?: string;
  segmentUri?:  string;
  parentId?:    number;
  priority:     number;
  clientCount:  number;
  outletCount:  number;
}

export interface AppDashClientStatsDto {
  total:          number;
  totalOutlets:   number;
  totalSegments:  number;
  unassigned:     number;
}
