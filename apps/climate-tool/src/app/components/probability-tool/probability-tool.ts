import { Component, Input, SimpleChanges } from '@angular/core';
import { IProbabilities } from '@picsa/climate/src/app/models';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss']
})

// take an array of numbers (values) and number to test (x), and display metrics
export class ProbabilityToolComponent {
  @Input() values: number[];
  @Input() x: number;
  @Input() chartName: string;
  // for start of seasion need to reverse
  @Input() reverseProbabilities: boolean;
  probabilities = DEFAULT_PROBABILITIES;

  ngOnChanges(changes: SimpleChanges): void {
    const p = this.calculateProbabilities();
    this.probabilities = this.reverseProbabilities
      ? this._swapValues(p, 'above', 'below')
      : p;
  }

  // given a line tool value lookup the existing values and return probability information
  // based on how many points are above and below the given value
  // various outputs used to assist rendering graphics (e.g. number arrays and reverse %)
  calculateProbabilities(): IProbabilities {
    const x = this.x;
    const points = this.values;
    let totalAbove = 0;
    let totalBelow = 0;
    for (const point of points) {
      if (point != null) {
        if (point > x) {
          totalAbove++;
        } else {
          totalBelow++;
        }
      }
    }
    const ratio = this._toRatio(totalAbove, totalBelow);
    const total = totalAbove + totalBelow;
    return {
      above: {
        count: totalAbove,
        pct: Math.round((totalAbove / total) * 100),
        inTen: Math.round((totalAbove / total) * 10)
      },
      below: {
        count: totalBelow,
        pct: 100 - Math.round((totalAbove / total) * 100),
        inTen: 1 - Math.round((totalAbove / total) * 10)
      },
      total,
      ratio
    };
  }

  public numberToArray(n: number) {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(i);
    return arr;
  }

  // represent a number in simplest forms x:1 or 1:x
  private _toRatio(above: number, below: number) {
    let ratio = [0, 0];
    const i = Math.round((below + above) / above);
    const j = Math.round((below + above) / below);
    if (above != 0 && above <= below) {
      ratio = [1, i - 1];
    }
    if (below != 0 && below <= above) {
      ratio = [j - 1, 1];
    }
    return ratio as [number, number];
  }

  private _swapValues(obj: any, key1: string, key2: string) {
    return {
      ...obj,
      [key1]: obj[key2],
      [key2]: obj[key1]
    };
  }
}

const DEFAULT_PROBABILITIES = {
  above: {
    count: 0,
    pct: 0,
    inTen: 0
  },
  below: {
    count: 0,
    pct: 0,
    inTen: 0
  },
  total: 0,
  ratio: [0, 0]
};
