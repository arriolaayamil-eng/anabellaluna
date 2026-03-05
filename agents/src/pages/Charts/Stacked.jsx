import React from 'react';

import { ChartsHeader, Stacked as StackedChart } from '../../components';

const Stacked = () => (
  <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
    <ChartsHeader category="Stacked" title="Revenue Breakdown" />
    <div className="w-full">
      <StackedChart />
    </div>
  </div>
);

export default Stacked;
