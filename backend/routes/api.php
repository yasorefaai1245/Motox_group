
<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\MotorcycleController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ShowroomController;
use App\Http\Controllers\EnquiryController;
use App\Http\Controllers\TestRideController;
use App\Http\Controllers\PublicCatalogController;
use App\Http\Controllers\UserBrandController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public website APIs
Route::prefix('public')->group(function () {
    Route::get('/brands', [PublicCatalogController::class, 'brands']);
    Route::get('/motorcycles', [PublicCatalogController::class, 'motorcycles']);
    Route::get('/motorcycles/{motorcycle}', [PublicCatalogController::class, 'motorcycle']);
    Route::get('/services', [PublicCatalogController::class, 'services']);
    Route::get('/showrooms', [PublicCatalogController::class, 'showrooms']);
});

// Public customer requests
Route::post('/enquiries', [EnquiryController::class, 'store']);
Route::post('/test-rides', [TestRideController::class, 'store']);

// Authentication
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin and Data Entry
    Route::middleware('role:admin,data_entry')->group(function () {
        Route::apiResource('brands', BrandController::class);
        Route::apiResource('motorcycles', MotorcycleController::class);
        Route::apiResource('services', ServiceController::class);

        Route::get('/enquiries', [EnquiryController::class, 'index']);
        Route::get('/enquiries/{enquiry}', [EnquiryController::class, 'show']);
        Route::patch('/enquiries/{enquiry}', [EnquiryController::class, 'update']);

        Route::get('/test-rides', [TestRideController::class, 'index']);
        Route::get('/test-rides/{testRide}', [TestRideController::class, 'show']);
        Route::patch('/test-rides/{testRide}', [TestRideController::class, 'update']);
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('showrooms', ShowroomController::class);
        Route::apiResource('users', UserController::class)
            ->only(['index', 'store', 'show', 'update', 'destroy']);

        Route::get('/users/{user}/brands', [UserBrandController::class, 'index']);
        Route::put('/users/{user}/brands', [UserBrandController::class, 'update']);

        Route::delete('/enquiries/{enquiry}', [EnquiryController::class, 'destroy']);
        Route::delete('/test-rides/{testRide}', [TestRideController::class, 'destroy']);
    });
});
