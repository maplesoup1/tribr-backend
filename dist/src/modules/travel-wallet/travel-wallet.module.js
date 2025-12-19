"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelWalletModule = void 0;
const common_1 = require("@nestjs/common");
const travel_wallet_controller_1 = require("./travel-wallet.controller");
const travel_wallet_service_1 = require("./travel-wallet.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const supabase_module_1 = require("../../supabase/supabase.module");
let TravelWalletModule = class TravelWalletModule {
};
exports.TravelWalletModule = TravelWalletModule;
exports.TravelWalletModule = TravelWalletModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, supabase_module_1.SupabaseModule],
        controllers: [travel_wallet_controller_1.TravelWalletController],
        providers: [travel_wallet_service_1.TravelWalletService],
        exports: [travel_wallet_service_1.TravelWalletService],
    })
], TravelWalletModule);
//# sourceMappingURL=travel-wallet.module.js.map