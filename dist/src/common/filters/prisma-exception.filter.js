"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaClientExceptionFilter = class PrismaClientExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const timestamp = new Date().toISOString();
        let status = common_1.HttpStatus.BAD_REQUEST;
        let message = exception.message;
        let error = 'Bad Request';
        let errorCode;
        switch (exception.code) {
            case 'P2002': {
                status = common_1.HttpStatus.CONFLICT;
                error = 'Conflict';
                const target = exception.meta?.target;
                const field = target?.[0];
                if (field) {
                    message = `${field} is already taken`;
                    errorCode = `CONFLICT_${field.toUpperCase()}`;
                }
                else {
                    message = 'Resource already exists';
                    errorCode = 'CONFLICT_UNIQUE';
                }
                break;
            }
            case 'P2025': {
                status = common_1.HttpStatus.NOT_FOUND;
                error = 'Not Found';
                message = 'Resource not found';
                errorCode = 'NOT_FOUND';
                break;
            }
            case 'P2003': {
                status = common_1.HttpStatus.BAD_REQUEST;
                error = 'Bad Request';
                message = 'Invalid reference';
                errorCode = 'INVALID_REFERENCE';
                break;
            }
            default: {
                status = common_1.HttpStatus.BAD_REQUEST;
                error = 'Bad Request';
                message = 'Request could not be processed';
                errorCode = exception.code;
                break;
            }
        }
        response.status(status).json({
            statusCode: status,
            error,
            message,
            errorCode,
            timestamp,
        });
    }
};
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter;
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaClientExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map