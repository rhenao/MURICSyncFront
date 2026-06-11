import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type {
  UserReportFilterDto,
  UserReportResponseDto,
} from '../models/UserReport.model';

function cleanFilter(filter: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

const UserReportService = {
  async getReport(filter: UserReportFilterDto): Promise<UserReportResponseDto> {
    const response = await axiosSecurityAPIClient.get<{ data: UserReportResponseDto }>(
      '/users/report',
      { params: cleanFilter(filter as Record<string, unknown>) }
    );
    return response.data.data;
  },

  async exportCsv(filter: Omit<UserReportFilterDto, 'page' | 'pageSize'>): Promise<void> {
    const response = await axiosSecurityAPIClient.get('/users/report/export', {
      params: cleanFilter(filter as Record<string, unknown>),
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('download', `reporte-usuarios-${fecha}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default UserReportService;
