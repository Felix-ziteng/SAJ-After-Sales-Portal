"use client";

import { RequireRole } from "@/lib/auth/RequireRole";
import { usePageTitle } from "@/lib/hooks/usePageTitle";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Callout({ tone, children }: { tone: "info" | "warn" | "danger"; children: React.ReactNode }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
  } as const;
  return <div className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${styles[tone]}`}>{children}</div>;
}

function RoleCard({ name, code, desc }: { name: string; code: string; desc: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">
        {name} <span className="font-mono text-xs font-normal text-slate-400">{code}</span>
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function Dot({ yes }: { yes: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${yes ? "bg-emerald-500" : "bg-slate-300"}`}
      aria-label={yes ? "支持" : "不支持"}
    />
  );
}

const PERMISSION_ROWS: { feature: string; roles: [boolean, boolean, boolean, boolean, boolean] }[] = [
  { feature: "创建 / 提交请求", roles: [true, false, false, true, false] },
  { feature: "审批请求", roles: [false, true, false, true, false] },
  { feature: "仓库接收确认", roles: [false, false, true, true, false] },
  { feature: "浏览“总览”全局列表", roles: [true, true, true, true, false] },
  { feature: "凭工单号单独查询", roles: [true, true, true, true, true] },
  { feature: "数据分析仪表盘", roles: [false, false, false, true, false] },
  { feature: "用户账号管理", roles: [false, false, false, true, false] },
];

const NAV_ROWS = [
  { label: "总览", who: "技术员 / 经理 / 仓库 / 管理员", desc: "浏览、筛选系统内所有请求（按状态、请求类型、日期范围、工单号）" },
  { label: "工单", who: "技术员 / 管理员", desc: "技术员自己的工作队列——草稿、待审批、待确认的请求" },
  { label: "审批", who: "经理 / 管理员", desc: "待审批请求队列，支持单个或批量审批" },
  { label: "仓库", who: "仓库 / 管理员", desc: "待接收请求队列，支持批量标记接收、导出发货 CSV" },
  { label: "数据分析", who: "管理员", desc: "请求总量、状态分布、处理时长、按技术员统计等图表" },
  { label: "用户与角色", who: "管理员", desc: "创建 / 编辑 / 删除账号，分配角色，重置密码，解锁账号" },
];

const FLOW_STEPS = [
  { title: "创建", desc: "技术员在工单下新建请求，选类型、填产品/序列号，存为草稿" },
  { title: "提交", desc: "草稿信息确认无误后提交，进入审批环节" },
  { title: "经理审批", desc: "经理批准或驳回（驳回需填写原因，技术员可修改后重新提交）" },
  { title: "客户确认", desc: "系统生成一次性确认链接，客户填写收货地址、公司信息并签名确认" },
  { title: "仓库接收", desc: "仓库人员标记已接收，请求完成，随时可导出 PDF / CSV" },
];

const FAQ = [
  { q: "忘记密码怎么办？", a: "找管理员，在“用户与角色”页面帮你重置一个新密码，没有自助找回功能。" },
  { q: "明明密码没错，为什么一直登不进去？", a: "可能是连续输错 5 次被自动锁定了，找管理员解锁或者重置密码。" },
  { q: "为什么我看不到“审批”或“数据分析”这些菜单？", a: "导航栏只显示你角色有权限的菜单，比如技术员看不到“审批”（经理专属）和“数据分析”（管理员专属）。需要更多权限找管理员调整你的角色。" },
  { q: "语言切换错了，在哪改回来？", a: "登录后顶部导航栏最右侧有个语言下拉框，登录页和客户确认页也有（因为那两个页面不显示导航栏）。" },
  { q: "导出的 PDF / CSV 为什么是英文的，界面明明是中文？", a: "导出文件目前固定是英文格式，不跟随界面语言，这是设计如此，仓库和客户端习惯看英文单据。" },
  { q: "客户确认链接可以重复用吗？", a: "每个链接只对应一次确认。如果客户填错了或者链接失效，技术员可以在请求详情页点“重新发送”生成一个新链接。" },
];

function HelpPage() {
  usePageTitle("操作手册");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">帮助</p>
        <h1 className="text-lg font-semibold text-slate-900">操作手册</h1>
        <p className="mt-1 text-sm text-slate-500">
          面向技术员、经理、仓库与管理员四类角色的售后请求处理系统使用说明
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <Card title="系统概览">
          <p>
            这是一套内部使用的售后服务工单系统，围绕两类请求展开：<strong>整机更换</strong>
            （需要经理审批 + 客户在线确认收货信息）和<strong>配件发货</strong>
            （流程更短，直接进入仓库发货）。每个请求都挂在一个 Zendesk 工单号下，全程有处理记录可追溯。
          </p>
          <p className="text-slate-500">
            系统支持中文、英文、意大利语三种界面语言（右上角切换，选择会记住），但导出的 PDF
            单据和 CSV 表格目前固定是英文格式，不随界面语言变化。
          </p>
        </Card>

        <Card title="登录与账户">
          <p>
            账号由管理员统一创建和发放，<strong>没有自助注册入口</strong>
            。登录时用户名和显示名称都可以用来登录（比如账号是 <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">marco.rossi</code>
            ，显示名叫“Marco Rossi”，两个都能用来登录，只要不跟别人重名）。
          </p>
          <Callout tone="warn">
            <strong>忘记密码？</strong> 没有自助找回功能，只能联系管理员在“用户与角色”页面帮你重置。
          </Callout>
          <p>
            <strong>修改密码：</strong>登录后点右上角“修改密码”，需要输入当前密码 + 新密码（至少 8 位）。
          </p>
          <p>
            <strong>切换语言：</strong>登录页和顶部导航栏右侧都有语言下拉框，选完立即生效，下次打开会记住你上次选的语言。
          </p>
        </Card>

        <Card title="角色与权限">
          <p>一个账号可以同时拥有多个角色（比如既是技术员又是管理员）。系统按角色决定能看到哪些菜单、能做哪些操作。</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <RoleCard name="技术员" code="TECHNICIAN" desc="创建工单请求、提交、编辑草稿、生成客户确认链接" />
            <RoleCard name="经理" code="MANAGER" desc="审批 / 驳回整机更换请求，可批量审批" />
            <RoleCard name="仓库" code="WAREHOUSE" desc="确认发货接收，导出发货用 CSV" />
            <RoleCard name="管理员" code="ADMIN" desc="以上全部权限 + 用户账号管理 + 数据分析" />
            <RoleCard name="访客" code="VIEWER" desc="仅能凭工单号查询该工单下的请求，无法浏览全局列表" />
          </div>

          <div className="mt-1 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left tracking-wide text-slate-500 uppercase">
                  <th className="px-3 py-2">功能</th>
                  <th className="px-3 py-2 text-center">技术员</th>
                  <th className="px-3 py-2 text-center">经理</th>
                  <th className="px-3 py-2 text-center">仓库</th>
                  <th className="px-3 py-2 text-center">管理员</th>
                  <th className="px-3 py-2 text-center">访客</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-700">{row.feature}</td>
                    {row.roles.map((yes, i) => (
                      <td key={i} className="px-3 py-2 text-center">
                        <Dot yes={yes} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="核心工作流程">
          <p>以“整机更换”为例，一个请求从创建到完成会经过这几个阶段：</p>
          <ol className="flex flex-col gap-3">
            {FLOW_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
            <strong className="text-slate-700">配件发货</strong>请求流程更短——不需要经理审批也不需要客户确认，草稿提交后直接进入仓库接收环节。
            <br />
            <strong className="text-slate-700">暂停 / 取消</strong>可以在流程中任意非终态节点发起（需填写原因），随时可以恢复暂停的请求。
          </div>
        </Card>

        <Card title="功能页面导览">
          <p className="text-slate-500">顶部导航栏只显示你角色能访问的菜单项。</p>
          <div className="flex flex-col gap-2">
            {NAV_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-1 gap-1 rounded-md border border-slate-200 p-3 sm:grid-cols-[120px_1fr] sm:gap-3">
                <div>
                  <p className="font-medium text-slate-900">{row.label}</p>
                  <p className="font-mono text-[10px] text-slate-400">{row.who}</p>
                </div>
                <p className="text-xs text-slate-500">{row.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="账号管理（管理员）">
          <p>在“用户与角色”页面里，管理员可以：</p>
          <div>
            <p className="font-medium text-slate-900">新建账号</p>
            <p className="text-xs text-slate-500">填邮箱/登录名、显示名称、部门（选填）、初始密码（至少 8 位）、至少勾选一个角色。</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">编辑账号</p>
            <p className="text-xs text-slate-500">
              点某行的“编辑”，可以改显示名称、部门、启用/停用状态、角色，也可以在这里重置密码（留空则保留原密码不变）。
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900">删除账号</p>
            <Callout tone="info">
              <strong>已经产生过请求 / 审批 / 处理记录的账号无法删除</strong>
              ，系统会提示改成“停用”状态代替——这是为了保留历史记录的完整性。全新、从没用过的账号可以直接删除。管理员也不能删除自己当前登录的账号。
            </Callout>
          </div>
          <div>
            <p className="font-medium text-slate-900">解锁账号</p>
            <p className="text-xs text-slate-500">
              连续 5 次输错密码，账号会自动锁定（防止暴力破解密码）。锁定后即使密码输对也登不进去，需要管理员在编辑弹窗里点“解锁”，或者直接给该账号重置一个新密码（重置密码会顺带解锁）。
            </p>
          </div>
        </Card>

        <Card title="安全须知">
          <Callout tone="danger">
            <strong>目前是 HTTP 而非 HTTPS</strong>
            ，登录密码在传输过程中没有加密。请只在可信的网络环境（公司内网 / 可信 WiFi）下使用，避免在公共 WiFi 下登录。后续接入正式域名后会升级为
            HTTPS。
          </Callout>
          <p className="text-slate-500">
            登录会话有效期 30 天，超过后需要重新登录。退出登录、修改密码等操作都会有二次确认弹窗，避免误操作。
          </p>
        </Card>

        <Card title="常见问题">
          <div className="flex flex-col divide-y divide-slate-100">
            {FAQ.map((item) => (
              <div key={item.q} className="py-3 first:pt-0 last:pb-0">
                <p className="flex gap-1.5 text-sm font-medium text-slate-900">
                  <span className="font-mono text-xs text-slate-400">Q</span>
                  {item.q}
                </p>
                <p className="mt-1 pl-5 text-xs text-slate-500">{item.a}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <RequireRole role={["TECHNICIAN", "MANAGER", "WAREHOUSE", "ADMIN"]}>
      <HelpPage />
    </RequireRole>
  );
}
