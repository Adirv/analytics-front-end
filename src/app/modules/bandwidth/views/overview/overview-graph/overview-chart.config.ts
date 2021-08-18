import {getColorPalette} from "shared/utils/colors";
import {EChartOption} from "echarts";
import {ReportHelper} from "shared/services";

export function getChartConfig(): EChartOption {
  return {
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#dadada',
      borderWidth: 1,
      padding: 10,
      extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
      textStyle: {
        color: '#888888',
        fontFamily: 'Lato'
      },
      formatter: '',
      trigger: 'item'
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    color: '#6391ED',
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar'
      }
    ]
  };
}
