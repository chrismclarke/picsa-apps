import { IChartMeta } from '@picsa/models';
import { IClimateView } from '../models';

const CHART_TYPES: (IChartMeta & IClimateView)[] = [
  {
    _viewID: 'rainfall',
    _viewType: 'chart',
    name: 'Seasonal Rainfall',
    image: 'assets/img/season-rainfall.png',
    cropTableValue: 'water',
    y: 'Rainfall',
    yFormat: 'value',
    tools: { line: true },
    units: 'mm',
    definition:
      'Seasonal rainfall is defined as the total rain recorded from the start of the season until the end of the season'
  },
  {
    _viewID: 'start',
    _viewType: 'chart',
    name: 'Start of Season',
    image: 'assets/img/season-start.png',
    y: 'Start',
    yFormat: 'date-from-July',
    tools: { line: false },
    units: '',
    definition:
      'Start of season is defined as the first occasion (from 1st October) with more than 25mm in a 3 day period and no dry spell of 10 days or more within the following 30 days'
  },
  {
    _viewID: 'end',
    _viewType: 'chart',
    name: 'End of Season',
    image: 'assets/img/season-end.png',
    y: 'End',
    yFormat: 'date-from-July',
    tools: { line: false },
    units: '',
    definition:
      'End of season is defined as the last day in the season (1st October - 30th April) with more than 10mm of rainfall.'
  },
  {
    _viewID: 'length',
    _viewType: 'chart',
    name: 'Length of Season',
    image: 'assets/img/season-length.png',
    cropTableValue: 'length',
    y: 'Length',
    yFormat: 'value',
    tools: { line: true },
    units: 'days',
    definition:
      'Length of season is defined as the total days from the start of the season until the end of the season as defined'
  }
  // {name: "Combined Probability", image: "assets/img/combined-probability.png", page: "CombinedProbabilityPage", tools: { line: false }},
];

export default CHART_TYPES;