import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type {
  SecuritySettingsDto,
  UpdateSecuritySettingsDto,
} from '../models/SecuritySettings.model';

const SecuritySettingsService = {
  async getSettings(): Promise<SecuritySettingsDto> {
    const response = await axiosSecurityAPIClient.get<{ data: SecuritySettingsDto }>(
      '/security-settings'
    );
    return response.data.data;
  },

  async updateSettings(dto: UpdateSecuritySettingsDto): Promise<SecuritySettingsDto> {
    const response = await axiosSecurityAPIClient.put<{ data: SecuritySettingsDto }>(
      '/security-settings',
      dto
    );
    return response.data.data;
  },
};

export default SecuritySettingsService;
