import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import MediaTypeElement from "../../../../elements/MediaType.mjs";
const {
  visitors: {
    document: {
      objects: {
        MediaType: {
          $visitor: BaseMediaTypeVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class MediaTypeVisitor extends BaseMediaTypeVisitor {
  constructor(options) {
    super(options);
    this.element = new MediaTypeElement();
  }
}
export default MediaTypeVisitor;