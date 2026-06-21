import componentConfig from '../../../components-src/slider/component.config.json'
import studioConfig from '../../../components-src/slider/studio.config.json'
import mockData from '../../../components-src/slider/mock/data.json'
import SliderApp from '../../../components-src/slider/src/App'

export const registry = {
  slider: {
    componentConfig,
    studioConfig,
    component: SliderApp,
    mockData
  }
}
