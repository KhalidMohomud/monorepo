import { Icon } from "@/components/icon";
import type { OrderStatus } from "@/lib/types";
import { orderStatusLabel } from "./order-config";

const workflowStatuses: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
  "SERVED",
  "PAID",
];

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = workflowStatuses.indexOf(status);

  return (
    <div className="relative mt-10 grid grid-cols-5">
      <span className="absolute left-[10%] right-[10%] top-3.5 h-px bg-[#ddd2c1]" />
      {workflowStatuses.map((step, index) => {
        const completed = currentIndex >= 0 && index < currentIndex;
        const current = index === currentIndex;

        return (
          <div key={step} className="relative z-10 flex flex-col items-center">
            <span
              className={`flex size-7 items-center justify-center rounded-full border-2 bg-white transition ${
                completed
                  ? "border-[#eca735] bg-[#eca735] text-white"
                  : current
                    ? "border-[#e4a12e] text-[#e4a12e] shadow-[0_0_0_4px_#fff]"
                    : "border-[#d8cdbc] text-transparent"
              }`}
            >
              {completed ? (
                <Icon name="check" className="size-3.5" />
              ) : current ? (
                <span className="size-2.5 rounded-full bg-current" />
              ) : null}
            </span>
            <span
              className={`mt-2 text-[10px] font-medium sm:text-xs ${
                current ? "font-bold text-[#8a5d1d]" : "text-stone-700"
              }`}
            >
              {orderStatusLabel[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
