"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUploadUrlDto = void 0;
const class_validator_1 = require("class-validator");
const uploadFolders = [
    'workflow-files',
    'workflow-images',
    'workflow-previews',
];
class CreateUploadUrlDto {
    filename;
    folder;
    contentType;
}
exports.CreateUploadUrlDto = CreateUploadUrlDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    (0, class_validator_1.Matches)(/^[^/\\]+$/, {
        message: 'filename must not contain path separators',
    }),
    __metadata("design:type", String)
], CreateUploadUrlDto.prototype, "filename", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(uploadFolders),
    __metadata("design:type", Object)
], CreateUploadUrlDto.prototype, "folder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateUploadUrlDto.prototype, "contentType", void 0);
//# sourceMappingURL=create-upload-url.dto.js.map