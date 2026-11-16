"""A Tesla's VIN tells its battery: LFP cells, one motor or two, and the year."""

from __future__ import annotations

from custom_components.ev_household_planner.api import battery_from_tesla_vin, fits_drive, tesla_vin

LFP_2021 = "LRW3E7FA0MC123456"  # Model 3 from Shanghai, LFP, one motor, 2021
NMC_2021 = "LRW3E7EA0MC123456"
LR_2021 = "LRW3E7EB0MC123456"


def test_the_vin_of_a_tesla() -> None:
    assert tesla_vin(LFP_2021) == {"model": "3", "lfp": True, "dual": False, "year": 2021}
    assert tesla_vin(LR_2021)["dual"] is True  # type: ignore[index]
    assert tesla_vin("WVWZZZE1ZMP012345") is None and tesla_vin(None) is None and tesla_vin("LRW3") is None
    # LFP: Tesla's 60 kWh pack from 2021 on, 55 kWh before; other cells are for the dataset.
    assert battery_from_tesla_vin(LFP_2021) == 60.0
    assert battery_from_tesla_vin("LRW3E7FA0LC123456") == 55.0
    assert battery_from_tesla_vin("lrw3e7fa0mc123456") == 60.0
    assert battery_from_tesla_vin(NMC_2021) is None and battery_from_tesla_vin(LR_2021) is None


def test_a_variant_fits_one_motor_or_two() -> None:
    assert fits_drive("Standard Range Plus 2021", False) and not fits_drive("Standard Range Plus 2021", True)
    assert fits_drive("LR 2021", True) and fits_drive("Performance 2021", True)
    assert fits_drive("Long Range RWD 2024", False) and not fits_drive("Long Range RWD 2024", True)
    assert fits_drive("anything", None)
